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
