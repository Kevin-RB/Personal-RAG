import { ollama } from "ollama-ai-provider-v2";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const envModel = process.env.MODEL_NAME || '';
const embeddingEnvModel = process.env.EMBEDDING_MODEL || '';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || '',
});

// Define a list of models from different providers
export const modelList = {
    useOllama: ollama(envModel ?? ''),
    useGoogle: google('gemini-2.5-flash'),
} as const

// Define a type that represents the structure of modelList
export type modelListType = keyof typeof modelList;
// Define a type that represents the keys of modelList
export type modelListKey = typeof  modelList[modelListType];

export const embeddingModelList = {
    useOllama: ollama.textEmbeddingModel(embeddingEnvModel ?? ''),
    useGoogle: google.textEmbeddingModel(embeddingEnvModel ?? 'gemini-embedding-001'),
} as const