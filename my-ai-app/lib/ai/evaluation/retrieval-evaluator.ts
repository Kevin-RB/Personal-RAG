import { generateText, Output } from "ai";
import {
  type Document,
  type RetrievalEvaluation,
  RetrievalEvaluationSchema,
} from "@/lib/ai/types/rag";
import { lmstudioModel } from "@/lib/ai/utils/provider-config";

export type EvaluateRetrievalOptions = {
  query: string;
  documents: Document[];
  iterationCount: number;
};

export async function evaluateRetrieval({
  query,
  documents,
  iterationCount,
}: EvaluateRetrievalOptions): Promise<RetrievalEvaluation> {
  const documentsText = documents
    .map((doc, i) => `Document ${i + 1}:\n${doc.content}`)
    .join("\n\n---\n\n");

  const { output } = await generateText({
    model: lmstudioModel("google/gemma-2-9b"),
    output: Output.object({
      schema: RetrievalEvaluationSchema,
    }),
    system: `You are an expert at evaluating the quality of information retrieval results. Analyze the retrieved documents and assess how well they answer the query. Be critical and thorough in your evaluation. This is iteration ${iterationCount + 1} of the retrieval process.`,
    prompt: `Query: "${query}"

Retrieved Documents (${documents.length} documents):
${documentsText}

Evaluate these documents on:
1. Relevance (1-10): How relevant are they to the query?
2. Coverage (1-10): Do they cover all aspects/aspects of the query?
3. Confidence (0-1): Overall confidence that these documents sufficiently answer the query
4. Gaps: Specific information that is missing or unclear
5. Reasoning: Detailed explanation of your evaluation

Set isSufficient to true only if confidence >= 0.7.`,
  });

  return output;
}
