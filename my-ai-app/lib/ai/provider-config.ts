import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { wrapLanguageModel } from "ai";

const lmstudio = createOpenAICompatible({
  baseURL: "http://127.0.0.1:1234/v1",
  name: "lmstudio",
});

type modelIds = "google/gemma-2-9b";

export function lmstudioModel(model: modelIds) {
  const modelInstance = wrapLanguageModel({
    model: lmstudio(model),
    middleware: [devToolsMiddleware()],
  });

  return modelInstance;
}
