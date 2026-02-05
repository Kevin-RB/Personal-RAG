import { type Tool, tool } from "ai";
import z from "zod";
import { runSelfReflectingRAG } from "@/lib/ai/workflows/self-reflecting-rag";

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
  execute: async ({ query }) => {
    const result = await runSelfReflectingRAG({
      query,
      enableMultiQuery: true,
      maxIterations: 3,
      confidenceThreshold: 0.7,
      enableTelemetry: true,
    });

    return {
      documents: result.documents,
      metadata: {
        finalQuery: result.finalQuery,
        iterationsPerformed: result.iterationsPerformed,
        finalConfidence: result.finalConfidence,
        isSufficient: result.isSufficient,
        queryExpansions: result.queryExpansions,
        evaluationReasoning: result.evaluationReasoning,
      },
    };
  },
}) satisfies Tool;
