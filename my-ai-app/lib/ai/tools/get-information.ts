import type { Document } from "@langchain/core/documents";
import { type Tool, tool } from "ai";
import z from "zod";
import { sumarizingAgent } from "@/lib/ai/agents/summarizinng-agent";
import { runRetrievalPipeline } from "@/lib/ai/retrieval/pipeline";
import { getEvaluationForPrompt } from "@/lib/ai/retrieval/state";
import type { ToolProgressOutput } from "@/lib/ai/retrieval/types";
import type { RetrievalEvaluation } from "@/lib/ai/types/rag";

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
  async *execute({ query }) {
    const pipeline = runRetrievalPipeline({ query, maxIterations: 3 });
    let documents: Document[] = [];
    let evaluation: Partial<RetrievalEvaluation> | undefined;
    let attempts = 0;

    for await (const progress of pipeline) {
      if (progress.step === "result") {
        // Capture the final result data
        documents = progress.documents;
        evaluation = progress.evaluation;
        attempts = progress.totalAttempts;
      } else {
        // Stream simplified progress updates to UI
        let iteration: number | undefined;

        if ("attempt" in progress) {
          iteration = progress.attempt;
        } else if ("totalAttempts" in progress) {
          iteration = progress.totalAttempts;
        }

        const progressOutput: ToolProgressOutput = {
          step: progress.step,
          message: progress.message,
          iteration,
        };

        yield progressOutput;
      }
    }

    if (documents.length === 0) {
      throw new Error("Pipeline completed without retrieving any documents");
    }

    const evaluationToPrompt = getEvaluationForPrompt({
      retrievalAttempts: attempts,
      triedQueries: [],
      evaluation: evaluation ?? {},
      foundDocuments: new Set(documents),
      mostRelevantDocuments: new Set(),
      originalQuery: query,
    });

    const generatingSummaryOutput: ToolProgressOutput = {
      step: "generating-summary",
      message: `Generating summary from ${documents.length} retrieved documents...`,
      iteration: attempts,
    };
    yield generatingSummaryOutput;

    const summary = await sumarizingAgent.generate({
      prompt: `
        DOCUMENTS:
        ${documents
          .map((doc) => `Source: ${doc.metadata.source}\n${doc.pageContent}`)
          .join("\n\n---\n\n")}
        =================
        EVALUATION:
        ${JSON.stringify(evaluationToPrompt, null, 2)}  
      `,
    });

    const completeOutput: ToolProgressOutput = {
      step: "complete",
      message: summary.text,
      iteration: attempts,
    };
    yield completeOutput;
  },
}) satisfies Tool;
