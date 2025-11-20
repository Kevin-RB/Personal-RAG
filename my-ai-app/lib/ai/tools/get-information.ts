import { type Tool, tool } from "ai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import z from "zod";
import { db } from "../../db/db";
import { embeddings } from "../../db/schema/embeddings";
import { generateEmbedding } from "../embeddings";

export const findRelevantContent = async (userQuery: string) => {
  try {
    const userQueryEmbedded = await generateEmbedding(userQuery);
    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      userQueryEmbedded
    )})`;

    const similarGuides = await db
      .select({ name: embeddings.content, similarity })
      .from(embeddings)
      .where(gt(similarity, 0.5))
      .orderBy((t) => desc(t.similarity))
      .limit(10);
    return similarGuides;
  } catch (error) {
    console.error("Tool execution error:", error);
    return `Error retrieving information: ${error}`;
  }
};

export const getInformationTool = tool({
  description: "get information from your knowledge base to answer questions.",
  inputSchema: z.object({
    question: z.string().describe("the users question"),
  }),
  execute: async ({ question }) => findRelevantContent(question),
}) satisfies Tool;
