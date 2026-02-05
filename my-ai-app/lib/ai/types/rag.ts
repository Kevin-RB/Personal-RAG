import { z } from "zod";
import z3 from "zod/v3";

export const RetrievalEvaluationSchema = z.object({
  relevance: z
    .number()
    .min(1)
    .max(10)
    .describe("How relevant are the retrieved documents to the query (1-10)"),
  coverage: z
    .number()
    .min(1)
    .max(10)
    .describe(
      "How well do the documents cover all aspects of the query (1-10)"
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Overall confidence score that documents sufficiently answer the query (0-1)"
    ),
  isSufficient: z
    .boolean()
    .describe(
      "Whether the retrieved documents are sufficient (confidence >= 0.7)"
    ),
  gaps: z
    .array(z.string())
    .describe(
      "Specific gaps or missing information in the retrieved documents"
    ),
  reasoning: z
    .string()
    .describe("Detailed reasoning for the evaluation scores"),
});

export type RetrievalEvaluation = z.infer<typeof RetrievalEvaluationSchema>;

export const ExpandedQueriesSchema = z3.object({
  variations: z3
    .array(
      z3.object({
        query: z3
          .string()
          .describe("An expanded or modified version of the original query"),
        strategy: z3
          .enum(["broader", "narrower", "semantic", "gap_based"])
          .describe("The strategy used to create this variation"),
        rationale: z3
          .string()
          .describe("Why this variation might help find better results"),
      })
    )
    .min(1)
    .max(5)
    .describe("Multiple query variations to improve retrieval"),
});

export type ExpandedQueries = z3.infer<typeof ExpandedQueriesSchema>;
