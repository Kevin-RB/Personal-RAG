import {
  type DistanceStrategy,
  PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PoolConfig } from "pg";
import { embedding_langchain } from "../ai/embeddings";

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
  }
  return databaseUrl;
}

export const db = drizzle(getDatabaseUrl());

export const langchainVectorStore = await PGVectorStore.initialize(
  embedding_langchain,
  {
    postgresConnectionOptions: {
      type: "postgres",
      host: "127.0.0.1",
      port: 5432,
      user: "postgres",
      password: "mypassword",
      database: "postgres",
    } as PoolConfig,
    tableName: "testlangchainjs",
    columns: {
      idColumnName: "langchain_id",
      contentColumnName: "langchain_content",
      vectorColumnName: "langchain_vector",
      metadataColumnName: "langchain_metadata",
    },
    distanceStrategy: "cosine" as DistanceStrategy,
  }
);
