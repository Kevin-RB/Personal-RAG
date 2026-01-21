import { type Tool, tool } from "ai";
import z from "zod";

export const RAG_handmade = (userQuery: string) => {
  try {
    return `This is a handmade response to the question: ${userQuery}`;
  } catch (error) {
    console.error("Error in RAG_handmade:", error);
    throw error;
  }
};

export const getInformationTool = tool({
  description: "get information from your knowledge base to answer questions.",
  inputSchema: z.object({
    question: z.string().describe("the users question"),
  }),
  execute: async ({ question }) => RAG_handmade(question),
}) satisfies Tool;
