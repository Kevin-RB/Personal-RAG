import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LMStudioClient } from "@lmstudio/sdk";
import { wrapLanguageModel } from "ai";

export const lmstudioProvider = createOpenAICompatible({
  baseURL: "http://127.0.0.1:1234/v1",
  name: "lmstudio",
  supportsStructuredOutputs: true,
});

type ModelId = "google/gemma-2-9b" | "mistralai/ministral-3-14b-reasoning";

export function lmstudioModel(model: ModelId) {
  // Default: AI-SDK provider
  const modelInstance = lmstudioProvider(model);
  return wrapLanguageModel({
    model: modelInstance,
    middleware: [devToolsMiddleware()],
  });
}

export function LmstudioClientModel(model: ModelId) {
  const client = new LMStudioClient();
  return client.llm.model(model);
}

export const googleProvider = createGoogleGenerativeAI({
  // custom settings
  apiKey: process.env.GOOGLE_API_KEY || "",
});
