import type { Document } from "@langchain/core/documents";
import { generateText, Output } from "ai";
import {
  type RetrievalEvaluation,
  RetrievalEvaluationSchema,
} from "@/lib/ai/types/rag";
import { lmstudioModel } from "@/lib/ai/utils/provider-config";

export type EvaluateRetrievalOptions = {
  query: string[];
  documents: Document[];
};

export async function evaluateRetrieval({
  query,
  documents,
}: EvaluateRetrievalOptions): Promise<
  RetrievalEvaluation & { mostRelevantDocuments: Document[] }
> {
  const formattedDocuments = documents
    .map((doc, index) => {
      const docId = doc.id ?? `doc-${index + 1}`;
      let source = "unknown";

      if (doc.metadata?.source) {
        source = doc.metadata.source;
      }
      return `
      Chunk id: "${docId}"

      Source: "${source}"

      Content:
      ${doc.pageContent}`;
    })
    .join("\n\n");

  const { output } = await generateText({
    model: lmstudioModel("google/gemma-2-9b"),
    output: Output.object({
      schema: RetrievalEvaluationSchema,
    }),
    system:
      "You are an expert at evaluating the quality of information retrieval results. Analyze the retrieved documents and assess how well they answer the query. Be critical and thorough in your evaluation.",
    prompt: `Tried querys: "${query.join("\n")}"

    Retrieved Documents (${documents.length} documents):

    ${formattedDocuments}

    Evaluate these documents on:
    1. Relevance (1-10): How relevant are they to the query?
    2. Coverage (1-10): Do they cover all aspects/aspects of the query?
    3. Confidence (0-1): Overall confidence that these documents sufficiently answer the query
    4. Gaps: Specific information that is missing or unclear
    5. Reasoning: Detailed explanation of your evaluation
    6. IsSufficient: Based on the above, determine if the retrieved documents are sufficient to answer the query.
    7. Most Relevant documents: if there is a source that you consider is extremely relevant to the query, list it here for future searches using the source as filter, if you consider this source is worth querying againts. when listing a source, do not modify it.

    Set isSufficient to true only if confidence >= 0.7.`,
  });

  const { success, data: evaluationData } =
    await RetrievalEvaluationSchema.safeParseAsync(output);

  if (!success) {
    console.error(
      "Retrieval evaluation output did not match expected schema:",
      evaluationData
    );

    throw new Error("Invalid retrieval evaluation output");
  }

  let mostRelevantDocuments: Document[] = [];
  if (evaluationData.mostRelevantChunkIds.length > 0) {
    mostRelevantDocuments = documents.filter((doc) =>
      evaluationData.mostRelevantChunkIds.includes(doc.id ?? "")
    );
  }

  return { ...evaluationData, mostRelevantDocuments };
}
