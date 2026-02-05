import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import type { Document as LangChainDocument } from "@langchain/core/documents";
import {
  expandQuery,
  selectBestQuery,
} from "@/lib/ai/evaluation/query-expander";
import { evaluateRetrieval } from "@/lib/ai/evaluation/retrieval-evaluator";
import type {
  RetrievalEvaluation,
  Document as WorkflowDocument,
} from "@/lib/ai/types/rag";
import { reciprocalRankFusion } from "@/lib/ai/utils/ranking";
import {
  generateQueryId,
  logTelemetry,
  RAGTelemetryCollector,
} from "@/lib/ai/utils/telemetry";
import { vectorStorePGVector } from "@/lib/ai/utils/vector-store";

const VECTOR_TOP_K = 20;
const BM25_TOP_K = 20;
const BROAD_SEARCH_K = 40;
const MAX_ITERATIONS = 3;
const CONFIDENCE_THRESHOLD = 0.7;

export type SelfReflectingRAGOptions = {
  query: string;
  enableMultiQuery?: boolean;
  maxIterations?: number;
  confidenceThreshold?: number;
  enableTelemetry?: boolean;
};

export type SelfReflectingRAGResult = {
  documents: WorkflowDocument[];
  finalQuery: string;
  iterationsPerformed: number;
  finalConfidence: number;
  isSufficient: boolean;
  queryExpansions: string[];
  evaluationReasoning: string;
};

async function retrieveDocuments(query: string): Promise<WorkflowDocument[]> {
  // Perform broad vector search
  const broadDocs = await vectorStorePGVector.similaritySearch(
    query,
    BROAD_SEARCH_K
  );

  // Get top-K vector results
  const vectorResults = broadDocs.slice(0, VECTOR_TOP_K);

  // Perform BM25 retrieval on the broad set
  const bm25Retriever = new BM25Retriever({ docs: broadDocs, k: BM25_TOP_K });
  const bm25Results = await bm25Retriever.invoke(query);

  // Fuse results using RRF
  const fusedResults = reciprocalRankFusion(
    vectorResults as LangChainDocument[],
    bm25Results as LangChainDocument[]
  );

  // Convert to workflow document format
  return fusedResults.map((doc) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
  }));
}

async function performMultiQueryRetrieval(
  query: string
): Promise<WorkflowDocument[]> {
  // Generate multiple query variations
  console.log("expanding query for multi-query retrieval");
  const expansions = await expandQuery({
    originalQuery: query,
    iterationCount: 0,
  });

  console.log("query expansions generated:", expansions.variations);
  // Include original query + top 2 variations
  const queriesToSearch = [
    query,
    ...expansions.variations.slice(0, 2).map((v) => v.query),
  ];

  // Retrieve in parallel
  const allResults = await Promise.all(
    queriesToSearch.map(async (q) => {
      const docs = await retrieveDocuments(q);
      return { query: q, documents: docs };
    })
  );

  // Flatten and deduplicate by content
  const seen = new Set<string>();
  const uniqueDocs: WorkflowDocument[] = [];

  for (const result of allResults) {
    for (const doc of result.documents) {
      if (!seen.has(doc.content)) {
        seen.add(doc.content);
        uniqueDocs.push(doc);
      }
    }
  }

  return uniqueDocs;
}

type RAGState = {
  currentQuery: string;
  documents: WorkflowDocument[];
  evaluation: RetrievalEvaluation | undefined;
  iteration: number;
  queryExpansions: string[];
  triedQueries: Set<string>;
};

async function expandAndSelectQuery(
  state: RAGState,
  maxIterations: number,
  telemetry: RAGTelemetryCollector | null
): Promise<void> {
  if (!state.evaluation || state.iteration >= maxIterations - 1) {
    return;
  }

  const expansions = await expandQuery({
    originalQuery: state.currentQuery,
    gaps: state.evaluation.gaps,
    iterationCount: state.iteration,
  });

  const newQuery = selectBestQuery(expansions, Array.from(state.triedQueries));

  if (telemetry) {
    telemetry.recordQueryExpansion({
      fromQuery: state.currentQuery,
      toQuery: newQuery,
      reason: `Iteration ${state.iteration + 1}: ${state.evaluation.reasoning}`,
    });
  }

  state.queryExpansions.push(newQuery);
  state.triedQueries.add(newQuery);
  state.currentQuery = newQuery;
}

async function performRetrieval(
  state: RAGState,
  enableMultiQuery: boolean
): Promise<void> {
  if (enableMultiQuery && state.iteration === 0) {
    state.documents = await performMultiQueryRetrieval(state.currentQuery);
  } else {
    state.documents = await retrieveDocuments(state.currentQuery);
  }
}

function shouldStopIteration(
  evaluation: RetrievalEvaluation,
  confidenceThreshold: number
): boolean {
  return (
    evaluation.confidence >= confidenceThreshold && evaluation.isSufficient
  );
}

async function performIteration(
  state: RAGState,
  enableMultiQuery: boolean,
  confidenceThreshold: number,
  maxIterations: number,
  telemetry: RAGTelemetryCollector | null
): Promise<boolean> {
  // Step 1: Retrieve documents
  await performRetrieval(state, enableMultiQuery);
  console.log("retrieval performed");
  // Step 2: Evaluate retrieval
  state.evaluation = await evaluateRetrieval({
    query: state.currentQuery,
    documents: state.documents,
    iterationCount: state.iteration,
  });

  // Record telemetry
  if (telemetry) {
    telemetry.recordIteration({
      iterationNumber: state.iteration + 1,
      query: state.currentQuery,
      evaluation: state.evaluation,
      documentsRetrieved: state.documents.length,
    });
  }

  // Step 3: Check if sufficient
  if (shouldStopIteration(state.evaluation, confidenceThreshold)) {
    return true;
  }

  // Step 4: If not sufficient and not at max iterations, expand query
  await expandAndSelectQuery(state, maxIterations, telemetry);

  return false;
}

export async function runSelfReflectingRAG(
  options: SelfReflectingRAGOptions
): Promise<SelfReflectingRAGResult> {
  const {
    query,
    enableMultiQuery = true,
    maxIterations = MAX_ITERATIONS,
    confidenceThreshold = CONFIDENCE_THRESHOLD,
    enableTelemetry = true,
  } = options;

  const queryId = generateQueryId();
  const telemetry = enableTelemetry
    ? new RAGTelemetryCollector(queryId, query)
    : null;

  try {
    const state: RAGState = {
      currentQuery: query,
      documents: [],
      evaluation: undefined,
      iteration: 0,
      queryExpansions: [],
      triedQueries: new Set<string>([query]),
    };

    while (state.iteration < maxIterations) {
      const shouldStop = await performIteration(
        state,
        enableMultiQuery,
        confidenceThreshold,
        maxIterations,
        telemetry
      );

      if (shouldStop) {
        break;
      }

      state.iteration++;
    }

    // Set final telemetry
    if (telemetry) {
      telemetry.setFinalConfidence(state.evaluation?.confidence ?? 0);
      logTelemetry(telemetry.finalize());
    }

    return {
      documents: state.documents,
      finalQuery: state.currentQuery,
      iterationsPerformed: state.iteration + 1,
      finalConfidence: state.evaluation?.confidence ?? 0,
      isSufficient: state.evaluation?.isSufficient ?? false,
      queryExpansions: state.queryExpansions,
      evaluationReasoning: state.evaluation?.reasoning ?? "",
    };
  } catch (error) {
    if (telemetry) {
      telemetry.recordError(
        error instanceof Error ? error.message : "Unknown error"
      );
      logTelemetry(telemetry.finalize());
    }
    throw error;
  }
}
