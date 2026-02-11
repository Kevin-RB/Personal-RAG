import type { Document } from "@langchain/core/documents";
import type { RetrievalEvaluation } from "@/lib/ai/types/rag";
import type { RetrievalState } from "./types";

export function createRetrievalState(query: string): RetrievalState {
  return {
    retrievalAttempts: 0,
    triedQueries: [query],
    evaluation: {
      confidence: 0,
      gaps: [],
      relevance: 0,
      coverage: 0,
      isSufficient: false,
      reasoning: "",
      mostRelevantChunkIds: [],
    },
    foundDocuments: new Set<Document>(),
    mostRelevantDocuments: new Set<Document>(),
    originalQuery: query,
  };
}

export function shouldContinueIteration(
  state: RetrievalState,
  maxIterations: number
): boolean {
  return (
    state.retrievalAttempts < maxIterations && !state.evaluation.isSufficient
  );
}

export function incrementAttempts(state: RetrievalState): RetrievalState {
  return {
    ...state,
    retrievalAttempts: state.retrievalAttempts + 1,
  };
}

export function addTriedQueries(
  state: RetrievalState,
  queries: string[]
): RetrievalState {
  return {
    ...state,
    triedQueries: [...state.triedQueries, ...queries],
  };
}

export function updateEvaluation(
  state: RetrievalState,
  evaluation: Partial<RetrievalEvaluation>
): RetrievalState {
  return {
    ...state,
    evaluation: {
      ...state.evaluation,
      ...evaluation,
    },
  };
}

export function addMostRelevantDocuments(
  state: RetrievalState,
  documents: Document[]
): RetrievalState {
  const updatedMostRelevant = new Set(state.mostRelevantDocuments);
  for (const doc of documents) {
    updatedMostRelevant.add(doc);
  }
  return {
    ...state,
    mostRelevantDocuments: updatedMostRelevant,
  };
}

export function addFoundDocuments(
  state: RetrievalState,
  documents: Document[]
): RetrievalState {
  const updatedFound = new Set(state.foundDocuments);
  for (const doc of documents) {
    updatedFound.add(doc);
  }
  return {
    ...state,
    foundDocuments: updatedFound,
  };
}

export function getSourceFilter(state: RetrievalState): string[] | null {
  if (state.mostRelevantDocuments.size === 0) {
    return null;
  }

  const sources = new Set(
    Array.from(state.mostRelevantDocuments).map((doc) => doc.metadata.source)
  );

  return Array.from(sources);
}

export function getEvaluationForPrompt(
  state: RetrievalState
): Partial<RetrievalEvaluation> {
  return {
    gaps: state.evaluation.gaps,
    coverage: state.evaluation.coverage,
    confidence: state.evaluation.confidence,
    relevance: state.evaluation.relevance,
    isSufficient: state.evaluation.isSufficient,
  };
}
