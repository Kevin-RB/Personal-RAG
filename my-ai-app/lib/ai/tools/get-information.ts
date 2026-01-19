import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { generateObject, type Tool, tool } from "ai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import z from "zod";
import { db, langchainVectorStore } from "../../db/db";
import { embeddings } from "../../db/schema/embeddings";
import { generateEmbedding } from "../embeddings";
import { modelList } from "../models";
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

const RAG_langchain = async (userQuery: string) => {
  try {
    // 1. Basic retriever (your improved version)
    const store = await langchainVectorStore;
    const baseRetriever = store.asRetriever({
      k: 5, // Get more candidates
      searchType: "similarity",
    });

    const variations = await generateObject({
      system:
        "You are a helpful assistant that generates variations of user queries to improve search results.",
      model: modelList.useOllama,
      schema: z.object({
        variations: z
          .array(z.string())
          .describe("variations of the user query"),
      }),
      prompt: `Generate 3 different variations of the following question to improve search results:\n\nQuestion: "${userQuery}"\n\nVariations:`,
    });

    // console.log(
    //   "Generated variations:",
    //   JSON.stringify(variations.object.variations, null, 2)
    // );

    const allDocs = await Promise.allSettled(
      variations.object.variations.map((variant) =>
        baseRetriever.invoke(variant)
      )
    );

    const docs = allDocs.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      console.error("Error retrieving documents for a variant:", result.reason);
      return [];
    });

    // console.log(docs);

    return docs;
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

export const getInformationTool_langchain = tool({
  description: "get information from your knowledge base to answer questions.",
  inputSchema: z.object({
    question: z.string().describe("the users question"),
  }),
  execute: async ({ question }) => RAG_langchain(question),
}) satisfies Tool;
