import { type Tool, tool } from "ai";
import z from "zod";
import { sumarizingAgent } from "@/lib/ai/agents/summarizinng-agent";
import { retrieveInformation } from "@/lib/ai/retrieval";
import { getEvaluationForPrompt } from "@/lib/ai/retrieval/state";

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
    const result = await retrieveInformation({
      query,
      maxIterations: 3,
    });

    const evaluationToPrompt = getEvaluationForPrompt({
      retrievalAttempts: result.attempts,
      triedQueries: [],
      evaluation: result.evaluation,
      foundDocuments: new Set(result.documents),
      mostRelevantDocuments: new Set(),
      originalQuery: query,
    });

    const summary = await sumarizingAgent.generate({
      prompt: `
        DOCUMENTS:
        ${result.documents
          .map((doc) => `Source: ${doc.metadata.source}\n${doc.pageContent}`)
          .join("\n\n---\n\n")}
        =================
        EVALUATION:
        ${JSON.stringify(evaluationToPrompt, null, 2)}  
      `,
    });

    return summary.text;
  },
}) satisfies Tool;
