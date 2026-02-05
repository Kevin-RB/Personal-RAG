import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import type { Document as LangChainDocument } from "@langchain/core/documents";
import { type Tool, tool } from "ai";
import z from "zod";
import {
  expandQuery,
  selectBestQuery,
} from "@/lib/ai/evaluation/query-expander";
import { evaluateRetrieval } from "@/lib/ai/evaluation/retrieval-evaluator";
import type { RetrievalEvaluation } from "@/lib/ai/types/rag";
import { reciprocalRankFusion } from "@/lib/ai/utils/ranking";
import { vectorStorePGVector } from "@/lib/ai/utils/vector-store";

const retrieveSchema = z.object({
  query: z
    .string()
    .describe(
      "The query to retrieve information for, expand on the query, add context if needed."
    ),
});

const VECTOR_TOP_K = 20;
const BM25_TOP_K = 20;
const BROAD_SEARCH_K = 40;
const MAX_ITERATIONS = 3;
const CONFIDENCE_THRESHOLD = 0.7;

type WorkflowDocument = {
  content: string;
  metadata: Record<string, unknown>;
};

const retrieveDocuments = async (
  query: string
): Promise<WorkflowDocument[]> => {
  const broadDocs = await vectorStorePGVector.similaritySearch(
    query,
    BROAD_SEARCH_K
  );

  const vectorResults = broadDocs.slice(0, VECTOR_TOP_K);
  const bm25Retriever = new BM25Retriever({ docs: broadDocs, k: BM25_TOP_K });
  const bm25Results = await bm25Retriever.invoke(query);

  const fusedResults = reciprocalRankFusion(
    vectorResults as LangChainDocument[],
    bm25Results as LangChainDocument[]
  );

  return fusedResults.map((doc) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
  }));
};

const performMultiQueryRetrieval = async (
  query: string,
  iteration: number
): Promise<{ documents: WorkflowDocument[]; expansions: string[] }> => {
  const expansions = await expandQuery({
    originalQuery: query,
    iterationCount: iteration,
  });

  const queriesToSearch = [
    query,
    ...expansions.variations.slice(0, 2).map((variation) => variation.query),
  ];

  const allResults = await Promise.all(
    queriesToSearch.map(async (currentQuery) => {
      const documents = await retrieveDocuments(currentQuery);
      return { query: currentQuery, documents };
    })
  );

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

  return {
    documents: uniqueDocs,
    expansions: expansions.variations.map((variation) => variation.query),
  };
};

const shouldStopIteration = (
  evaluation: RetrievalEvaluation,
  confidenceThreshold: number
): boolean => {
  return (
    evaluation.confidence >= confidenceThreshold && evaluation.isSufficient
  );
};

export const getInformationTool = tool({
  title: "Get Information",
  description:
    "Retrieve information related to a query using self-reflecting RAG with multi-query expansion, hybrid search, and iterative evaluation. Automatically expands queries and retries if initial results are insufficient.",
  inputSchema: retrieveSchema,
  inputExamples: [
    {
      input: {
        query:
          "What are black holes, what is their nature, and how do they affect surrounding space?",
      },
    },
    {
      input: {
        query: "Why is the sky blue?, what physical phenomena cause this?",
      },
    },
  ],
  async *execute({ query }) {
    let currentQuery = query;
    let documents: WorkflowDocument[] = [];
    let evaluation: RetrievalEvaluation | undefined;
    let iteration = 0;
    const queryExpansions: string[] = [];
    const triedQueries = new Set<string>([query]);

    yield {
      status: "Expanding query for better coverage...",
      step: "expanding_query",
      iteration: iteration + 1,
    };

    while (iteration < MAX_ITERATIONS) {
      if (iteration === 0) {
        const multiQuery = await performMultiQueryRetrieval(
          currentQuery,
          iteration
        );
        documents = multiQuery.documents;
        queryExpansions.push(...multiQuery.expansions);
      } else {
        documents = await retrieveDocuments(currentQuery);
      }

      yield {
        status: `Evaluating ${documents.length} retrieved documents...`,
        step: "evaluating",
        iteration: iteration + 1,
      };

      evaluation = await evaluateRetrieval({
        query: currentQuery,
        documents,
        iterationCount: iteration,
      });

      if (shouldStopIteration(evaluation, CONFIDENCE_THRESHOLD)) {
        break;
      }

      if (iteration >= MAX_ITERATIONS - 1) {
        break;
      }

      yield {
        status: "Expanding query for the next iteration...",
        step: "expanding_query",
        iteration: iteration + 2,
      };

      const expansions = await expandQuery({
        originalQuery: currentQuery,
        gaps: evaluation.gaps,
        iterationCount: iteration,
      });

      const newQuery = selectBestQuery(expansions, Array.from(triedQueries));
      queryExpansions.push(newQuery);
      triedQueries.add(newQuery);
      currentQuery = newQuery;

      iteration++;
    }

    yield {
      documents,
      metadata: {
        finalQuery: currentQuery,
        iterationsPerformed: iteration + 1,
        finalConfidence: evaluation?.confidence ?? 0,
        isSufficient: evaluation?.isSufficient ?? false,
        queryExpansions,
        evaluationReasoning: evaluation?.reasoning ?? "",
      },
    };
  },
}) satisfies Tool;
