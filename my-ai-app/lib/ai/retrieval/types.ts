import type { Document } from "@langchain/core/documents";
import type { RetrievalEvaluation } from "@/lib/ai/types/rag";

export type RetrievalState = {
  retrievalAttempts: number;
  triedQueries: string[];
  evaluation: Partial<RetrievalEvaluation>;
  foundDocuments: Set<Document>;
  mostRelevantDocuments: Set<Document>;
  originalQuery: string;
};

export type RetrievalResult = {
  documents: Document[];
  evaluation: Partial<RetrievalEvaluation>;
  attempts: number;
};

export type RetrievalOptions = {
  query: string;
  maxIterations?: number;
};

export type VectorSearchOptions = {
  queries: string[];
  limit?: number;
  filter?: {
    source: {
      in: string[];
    };
  };
};

export type RetrievalIteration = {
  queries: string[];
  vectorResults: Document[];
  bm25Results: Document[];
  fusedResults: Document[];
  evaluation: RetrievalEvaluation & { mostRelevantDocuments: Document[] };
};

// Base type with common fields
export type RetrievalProgressBase = {
  message: string;
};

export type RetrievalProgressIterationStart = RetrievalProgressBase & {
  step: "iteration-start";
  attempt: number;
  maxIterations: number;
};

export type RetrievalProgressQueriesReady = RetrievalProgressBase & {
  step: "queries-ready";
  attempt: number;
  queries: string[];
};

export type RetrievalProgressIterationComplete = RetrievalProgressBase & {
  step: "iteration-complete";
  attempt: number;
  documentsFound: number;
  confidence: number;
  isSufficient: boolean;
};

export type RetrievalProgressComplete = RetrievalProgressBase & {
  step: "complete";
  totalAttempts: number;
  totalDocuments: number;
};

export type RetrievalProgressResult = RetrievalProgressBase & {
  step: "result";
  documents: Document[];
  evaluation: Partial<RetrievalEvaluation>;
  totalAttempts: number;
};

export type RetrievalProgress =
  | RetrievalProgressIterationStart
  | RetrievalProgressQueriesReady
  | RetrievalProgressIterationComplete
  | RetrievalProgressComplete
  | RetrievalProgressResult;

// Typed steps for the tool progress output
export type ToolProgressStep =
  | "iteration-start"
  | "queries-ready"
  | "iteration-complete"
  | "complete"
  | "generating-summary";

// Simplified progress output for tool results (used by InferAgentUIMessage)
// Copy this type to your frontend
export type ToolProgressOutput = {
  step: ToolProgressStep;
  message: string;
  iteration?: number;
};
