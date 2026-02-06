import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import type { Document } from "@langchain/core/documents";
import { type Tool, tool } from "ai";
import z from "zod";
import { expandQuery } from "@/lib/ai/evaluation/query-expander";
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

export const getInformationTool = tool({
  title: "Get Information",
  description:
    "Retrieve information related to a query using self-reflecting RAG with multi-query expansion, hybrid search, and iterative evaluation. Automatically expands queries and retries if initial results are insufficient.",
  inputSchema: retrieveSchema,
  async execute({ query }) {
    const state: {
      retrievalAttempts: number;
      triedQueries: string[];
      evaluation: Partial<RetrievalEvaluation>;
      foundDocuments: Document[];
      mostRelevantDocuments: Document[];
    } = {
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
      foundDocuments: [],
      mostRelevantDocuments: [],
    };

    const MAX_ITERATIONS = 3;

    while (
      state.retrievalAttempts < MAX_ITERATIONS &&
      !state.evaluation.isSufficient
    ) {
      let iterationQueries = [query];

      if (state.retrievalAttempts > 0) {
        const expandedQueries = await expandQuery({
          originalQuery: query,
          gaps: state.evaluation.gaps, // Optionally pass identified gaps from previous retrievals
          triedQueries: state.triedQueries, // Keep track of tried queries to avoid repetition
        });
        iterationQueries = expandedQueries.variations.map((v) => v.query);
      }

      const queryOptions = { source: {} };

      if (state.mostRelevantDocuments.length > 0) {
        console.log(
          "================ Applying Source Filter for Retrieval ================="
        );
        const dedupSources = new Set(
          state.mostRelevantDocuments.map((doc) => doc.metadata.source)
        );

        queryOptions.source = {
          in: Array.from(dedupSources),
        };
      }
      // Perform initial retrieval using vector search with expanded queries
      console.log(
        "================ Initial Vector Search Results ================="
      );
      console.log("Iteration Queries:", iterationQueries);
      console.log("Applied Source Filter:", queryOptions);
      const result = await Promise.all(
        iterationQueries.map((query) =>
          vectorStorePGVector.similaritySearch(query, 5, queryOptions)
        )
      );

      const flatResult = result.flat(2);

      console.log(flatResult.map((documents) => ({ content: documents.id })));

      // Perform a secondary retrieval using BM25 on the initial results to improve relevance
      const retriever = BM25Retriever.fromDocuments(flatResult, { k: 5 });

      const BM25result = await retriever.invoke(query);
      console.log(
        "================ BM25 Retriever Initialized with Top 20 Vector Results ================="
      );
      console.log(BM25result.map((doc) => ({ content: doc.id })));

      // Combine and re-rank results from both retrieval methods using Reciprocal Rank Fusion
      const RRFrankedDocuments = reciprocalRankFusion(flatResult, BM25result);
      console.log(
        "================ Reciprocal Rank Fusion Results ================="
      );
      console.log(RRFrankedDocuments.map((doc) => ({ content: doc.id })));

      const evaluation = await evaluateRetrieval({
        query: state.triedQueries,
        documents: RRFrankedDocuments,
      });

      console.log("================ Retrieval Evaluation =================");
      console.log(evaluation);
      // Update state based on evaluation
      state.evaluation = evaluation;
      state.retrievalAttempts++;
      state.triedQueries.push(...iterationQueries);

      if (
        evaluation.mostRelevantDocuments.length > 0 &&
        !evaluation.isSufficient
      ) {
        // If the evaluation identifies specific documents as highly relevant, we can prioritize those in the next retrieval iteration
        // For example, we could filter the vector store retrieval to focus on documents from those sources, or use them as additional context in the query expansion step.
        console.log(
          "================ Most Relevant Documents Identified ================="
        );
        console.log(evaluation.mostRelevantDocuments);
        state.mostRelevantDocuments.push(...evaluation.mostRelevantDocuments);
      }

      if (evaluation.isSufficient) {
        // Update gaps based on evaluation for next iteration
        state.foundDocuments.push(...RRFrankedDocuments);
        break;
      }
    }

    return state.foundDocuments.map((doc) => doc.pageContent).join("\n\n");
  },
}) satisfies Tool;
