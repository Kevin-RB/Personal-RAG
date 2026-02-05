import type { Document } from "@langchain/core/documents";

// RRF constant
const RRF_K = 60;
const FINAL_TOP_K = 5;

type RrfResult = {
  doc: Document;
  score: number;
};

export const reciprocalRankFusion = (
  vectorResults: Document[],
  bm25Results: Document[]
): Document[] => {
  const rrfScores = new Map<string, RrfResult>();

  for (let i = 0; i < vectorResults.length; i++) {
    const doc = vectorResults[i];
    const rank = i + 1;
    const score = 1 / (RRF_K + rank);

    const key = doc.pageContent;
    const existing = rrfScores.get(key);

    if (existing) {
      existing.score += score;
    } else {
      rrfScores.set(key, { doc, score });
    }
  }

  for (let i = 0; i < bm25Results.length; i++) {
    const doc = bm25Results[i];
    const rank = i + 1;
    const score = 1 / (RRF_K + rank);

    const key = doc.pageContent;
    const existing = rrfScores.get(key);

    if (existing) {
      existing.score += score;
    } else {
      rrfScores.set(key, { doc, score });
    }
  }

  const fusedResults = Array.from(rrfScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, FINAL_TOP_K)
    .map((result) => result.doc);

  return fusedResults;
};
