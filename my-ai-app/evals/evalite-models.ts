import { wrapAISDKModel } from "evalite/ai-sdk";
import { RAG_agent } from "../lib/ai/agents/rag-agent";
import { modelList } from "../lib/ai/models";

export const testingModels = {
  ollama: wrapAISDKModel(modelList.useOllama),
  google: wrapAISDKModel(modelList.useGoogle),
} as const;

export type testingModelsType = keyof typeof testingModels;
export type testingModels = (typeof testingModels)[testingModelsType];

export const RAG_agent_evalite = RAG_agent({ model: testingModels.ollama });
