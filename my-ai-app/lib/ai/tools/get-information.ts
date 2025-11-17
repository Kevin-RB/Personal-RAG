import { tool, Tool } from "ai";
import z from "zod";
import { generateEmbedding } from "../embeddings";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../../db/schema/embeddings";
import { db } from "../../db/db";

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;

  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy(t => desc(t.similarity))
    .limit(4);
  return similarGuides;
};

export const getInformationTool = tool({
    description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe('the users question'),
        }),
    execute: async ({ question }) => findRelevantContent(question),
}) satisfies Tool