import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ollama } from "ollama-ai-provider-v2";

const envModel = process.env.MODEL_NAME || "llama3.1";
const embeddingEnvModel = process.env.EMBEDDING_MODEL || "nomic-embed-text";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

// Define a list of models from different providers
export const modelList = {
  useOllama: ollama(envModel),
  useGoogle: google("gemini-2.5-flash"),
} as const;

// Define a type that represents the structure of modelList
export type modelListType = keyof typeof modelList;
// Define a type that represents the keys of modelList
export type modelListKey = (typeof modelList)[modelListType];

export const embeddingModelList = {
  useOllama: ollama.textEmbeddingModel(embeddingEnvModel),
  useGoogle: google.textEmbeddingModel("text-embedding-004"),
} as const;

export type embeddingModelListType = keyof typeof embeddingModelList;
export type embeddingModelListKey =
  (typeof embeddingModelList)[embeddingModelListType];
