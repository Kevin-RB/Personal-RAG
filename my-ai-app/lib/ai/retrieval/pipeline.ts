import { expandQuery } from "@/lib/ai/evaluation/query-expander";
import { evaluateRetrieval } from "@/lib/ai/evaluation/retrieval-evaluator";
import {
  addFoundDocuments,
  addMostRelevantDocuments,
  addTriedQueries,
  createRetrievalState,
  getSourceFilter,
  incrementAttempts,
  shouldContinueIteration,
  updateEvaluation,
} from "./state";
import {
  buildSourceFilter,
  fuseResults,
  performBM25Search,
  performVectorSearch,
} from "./strategies";
import type {
  RetrievalIteration,
  RetrievalOptions,
  RetrievalProgress,
  RetrievalState,
} from "./types";

async function executeIteration(
  state: RetrievalState,
  iterationQueries: string[]
): Promise<RetrievalIteration> {
  const sources = getSourceFilter(state);

  const vectorResults = await performVectorSearch({
    queries: iterationQueries,
    limit: sources ? 5 : 20,
    filter: sources ? buildSourceFilter(sources) : undefined,
  });

  const bm25Results = await performBM25Search(
    vectorResults,
    state.originalQuery
  );
  const fusedResults = fuseResults(vectorResults, bm25Results);

  const evaluation = await evaluateRetrieval({
    query: state.triedQueries,
    documents: fusedResults,
  });

  console.log("================ Retrieval Evaluation =================");
  console.log(evaluation);

  return {
    queries: iterationQueries,
    vectorResults,
    bm25Results,
    fusedResults,
    evaluation,
  };
}

async function getIterationQueries(
  state: RetrievalState,
  isFirstIteration: boolean
): Promise<string[]> {
  if (isFirstIteration) {
    return [state.originalQuery];
  }

  const expandedQueries = await expandQuery({
    originalQuery: state.originalQuery,
    gaps: state.evaluation.gaps,
    triedQueries: state.triedQueries,
  });

  return expandedQueries.variations.map((v) => v.query);
}

function updateStateFromIteration(
  state: RetrievalState,
  iteration: RetrievalIteration
): RetrievalState {
  let updatedState = incrementAttempts(state);
  updatedState = addTriedQueries(updatedState, iteration.queries);
  updatedState = updateEvaluation(updatedState, iteration.evaluation);

  const { mostRelevantDocuments } = iteration.evaluation;

  if (mostRelevantDocuments.length > 0 && !iteration.evaluation.isSufficient) {
    console.log(
      "================ Most Relevant Documents Identified ================="
    );
    console.log(mostRelevantDocuments.map((doc) => doc.id));

    for (const doc of mostRelevantDocuments) {
      console.log("Adding document to most relevant set:", doc.metadata.source);
    }

    updatedState = addMostRelevantDocuments(
      updatedState,
      mostRelevantDocuments
    );
  }

  if (iteration.evaluation.isSufficient) {
    const documentsToAdd = mostRelevantDocuments.filter(
      (doc) => !updatedState.foundDocuments.has(doc)
    );

    for (const doc of documentsToAdd) {
      console.log("Adding document to found set:", doc.id);
    }

    updatedState = addFoundDocuments(updatedState, documentsToAdd);
    updatedState = addFoundDocuments(updatedState, iteration.fusedResults);
  }

  return updatedState;
}

export async function* runRetrievalPipeline(
  options: RetrievalOptions
): AsyncIterable<RetrievalProgress> {
  const { query, maxIterations = 3 } = options;

  let state = createRetrievalState(query);

  while (shouldContinueIteration(state, maxIterations)) {
    const currentAttempt = state.retrievalAttempts + 1;

    yield {
      step: "iteration-start",
      attempt: currentAttempt,
      maxIterations,
      message: `Starting retrieval attempt ${currentAttempt}/${maxIterations}`,
    };

    const isFirstIteration = state.retrievalAttempts === 0;
    const iterationQueries = await getIterationQueries(state, isFirstIteration);

    yield {
      step: "queries-ready",
      attempt: currentAttempt,
      queries: iterationQueries,
      message: `Searching with ${iterationQueries.length} query variation(s)`,
    };

    const iteration = await executeIteration(state, iterationQueries);

    yield {
      step: "iteration-complete",
      attempt: currentAttempt,
      documentsFound: iteration.fusedResults.length,
      confidence: iteration.evaluation.confidence,
      isSufficient: iteration.evaluation.isSufficient,
      message: iteration.evaluation.isSufficient
        ? `Found sufficient information (confidence: ${iteration.evaluation.confidence})`
        : `Insufficient results (confidence: ${iteration.evaluation.confidence}), will retry`,
    };

    state = updateStateFromIteration(state, iteration);
  }

  console.log(
    "================ Final Retrieved Documents After Iterations ================="
  );
  console.log(Array.from(state.foundDocuments).map((doc) => doc.id));

  console.log("================ Final Found Documents =================");
  console.log(state.foundDocuments.values());

  yield {
    step: "complete",
    totalAttempts: state.retrievalAttempts,
    totalDocuments: state.foundDocuments.size,
    message: `Retrieval complete after ${state.retrievalAttempts} attempt(s)`,
  };

  yield {
    step: "result",
    documents: Array.from(state.foundDocuments),
    evaluation: state.evaluation,
    totalAttempts: state.retrievalAttempts,
    message: "Final retrieval result",
  };
}
