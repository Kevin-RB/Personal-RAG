import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { type Tool, tool } from "ai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import z from "zod";
import { db } from "../../db/db";
import { embeddings } from "../../db/schema/embeddings";
import { generateEmbedding } from "../embeddings";
import { generateVariants } from "./enhance-query";

export const RAG_handmade = async (userQuery: string) => {
  try {
    // generate variants of the user question
    const { variants } = await generateVariants(userQuery);

    const userQueryEmbedded = await generateEmbedding(userQuery);

    // generate embeddings for the variants
    const variantEmbeddings = await Promise.all(
      variants.map((variant) => generateEmbedding(variant))
    );

    // combine the embeddings of the user query and the variants
    const allQueryEmbeddings = [userQueryEmbedded, ...variantEmbeddings];

    // calculate the distance between the embeddings
    const distanceExpressions = allQueryEmbeddings.map((queryEmbedding) =>
      cosineDistance(embeddings.embedding, queryEmbedding)
    );

    // Find the minimum distance among all query embeddings for the current embedding row
    const minDistance = sql<number>`LEAST(${sql.join(distanceExpressions, sql`, `)})`;
    const similarity = sql<number>`1 - ${minDistance}`;

    // Stage 1: Find top marching chunks
    const topMatches = await db
      .select({
        name: embeddings.content,
        resourceId: embeddings.resourceId,
        pageNumber: embeddings.pageNumber,
        similarity,
      })
      .from(embeddings)
      .where(gt(similarity, 0.5))
      .orderBy((t) => desc(t.similarity))
      .limit(5);

    // console.log("topMatches");
    // console.log(topMatches);

    if (topMatches.length === 0) {
      throw new Error("No relevant information found.");
    }

    // Stage 2: Get resource IDs and fetch contextual chunks
    const resourceIds = [...new Set(topMatches.map((m) => m.resourceId))];

    // fetch all chunks for the resource IDs
    const fullResourceCunks = await db
      .select({
        id: embeddings.id,
        content: embeddings.content,
        resourceId: embeddings.resourceId,
        pageNumber: embeddings.pageNumber,
        similarity,
      })
      .from(embeddings)
      .where(sql`${embeddings.resourceId} IN ${resourceIds}`);

    // convert the chunks to documents
    const chunksAsDocuments = fullResourceCunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: {
        pageNumber: chunk.pageNumber,
        resourceId: chunk.resourceId,
        similarity: chunk.similarity,
      },
    }));

    // console.log("chunksAsDocuments");
    // console.log(chunksAsDocuments);

    // create a retriever from the chunks
    const retriever = BM25Retriever.fromDocuments(chunksAsDocuments, { k: 4 });
    const results = await retriever.invoke(userQuery);

    // convert the results to the same format as topMatches
    const BM25Results = results.map((result) => ({
      name: result.pageContent,
      similarity: result.metadata.similarity,
      pageNumber: result.metadata.pageNumber,
      resourceId: result.metadata.resourceId,
    }));

    // console.log("BM25Results");
    // console.log(BM25Results);

    // sort the results by similarity
    const sortedResults = [...topMatches, ...BM25Results].sort(
      (a, b) => b.similarity - a.similarity
    );
    return sortedResults;
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
  execute: async ({ question }) => RAG_handmade(question),
}) satisfies Tool;
