import { wrapAISDKModel } from "evalite/ai-sdk";
import { modelList } from "../lib/ai/models";

export const testingModels = {
  ollama: wrapAISDKModel(modelList.useOllama),
  google: wrapAISDKModel(modelList.useGoogle),
} as const;

export type testingModelsType = keyof typeof testingModels;
export type testingModels = (typeof testingModels)[testingModelsType];
