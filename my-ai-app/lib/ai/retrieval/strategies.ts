import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import type { Document } from "@langchain/core/documents";
import { reciprocalRankFusion } from "@/lib/ai/utils/ranking";
import { vectorStorePGVector } from "@/lib/ai/utils/vector-store";
import type { VectorSearchOptions } from "./types";

export async function performVectorSearch(
  options: VectorSearchOptions
): Promise<Document[]> {
  const { queries, limit = 5, filter } = options;

  if (filter) {
    console.log(
      "================ Vector Search with Source Filter ================="
    );
    console.log("Iteration Queries:", queries);
    console.log("Applied Source Filter:", filter);

    const results = await Promise.all(
      queries.map((query) =>
        vectorStorePGVector.similaritySearch(query, limit, filter)
      )
    );

    const flatResults = results.flat(2);
    console.log(flatResults.map((documents) => documents.id));

    return flatResults;
  }

  console.log(
    "================ Initial Vector Search Results (No Source Filter) ================="
  );
  console.log("Iteration Queries:", queries);

  const results = await vectorStorePGVector.similaritySearch(queries[0], limit);
  console.log(results.map((documents) => documents.id));

  return results;
}

export async function performBM25Search(
  documents: Document[],
  query: string,
  k = 5
): Promise<Document[]> {
  const retriever = BM25Retriever.fromDocuments(documents, { k });

  console.log(
    "================ BM25 Retriever Initialized with Top 20 Vector Results ================="
  );

  const results = await retriever.invoke(query);
  console.log(results.map((doc) => doc.id));

  return results;
}

export function fuseResults(
  vectorResults: Document[],
  bm25Results: Document[]
): Document[] {
  console.log(
    "================ Reciprocal Rank Fusion Results ================="
  );

  const fused = reciprocalRankFusion(vectorResults, bm25Results);
  console.log(fused.map((doc) => doc.id));

  return fused;
}

export function buildSourceFilter(sources: string[]): {
  source: { in: string[] };
} {
  console.log(
    "================ Applying Source Filter for Retrieval ================="
  );

  return {
    source: {
      in: sources,
    },
  };
}
