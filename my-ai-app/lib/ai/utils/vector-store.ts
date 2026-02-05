import {
  type DistanceStrategy,
  PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import type { PoolConfig } from "pg";
import { getEmbeddingModel } from "@/lib/ai/utils/embeddings";

// Sample config
const config = {
  postgresConnectionOptions: {
    type: "postgres",
    host: "127.0.0.1",
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  } as PoolConfig,
  tableName: "testlangchainjs",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  // supported distance strategies: cosine (default), innerProduct, or euclidean
  distanceStrategy: "cosine" as DistanceStrategy,
};

const embeddings = getEmbeddingModel({
  provider: "langchain",
  model: "text-embedding-mxbai-embed-large-v1",
  dimensions: 520,
});

export const vectorStorePGVector = await PGVectorStore.initialize(
  embeddings,
  config
);
