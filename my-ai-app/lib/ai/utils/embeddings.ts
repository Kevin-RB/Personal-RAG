import { OpenAIEmbeddings } from "@langchain/openai";
import { lmstudioProvider } from "@/lib/ai/utils/provider-config";

type embeddingModelIds = "text-embedding-mxbai-embed-large-v1";

function getLmstudioEmbeddingModel(config: { model: embeddingModelIds }) {
  return lmstudioProvider.embeddingModel(config.model);
}

function getLangchainEmbeddingModel(config: {
  model: embeddingModelIds;
  dimensions: number;
}) {
  return new OpenAIEmbeddings({
    model: config.model,
    apiKey: "lm-studio",
    dimensions: config.dimensions,
    encodingFormat: "float",
    stripNewLines: true,
    configuration: {
      baseURL: "http://127.0.0.1:1234/v1",
    },
  });
}

// ============================================
// OVERLOAD VERSION - Better Type Safety
// ============================================

type EmbeddingModelConfig =
  | { provider: "lmstudio"; model: embeddingModelIds }
  | { provider: "langchain"; model: embeddingModelIds; dimensions: number };

type ConfigReturnType = {
  lmstudio: ReturnType<typeof getLmstudioEmbeddingModel>;
  langchain: ReturnType<typeof getLangchainEmbeddingModel>;
};

// Overload signatures - TypeScript picks the right one based on provider
export function getEmbeddingModel(
  config: Extract<EmbeddingModelConfig, { provider: "lmstudio" }>
): ConfigReturnType["lmstudio"];

export function getEmbeddingModel(
  config: Extract<EmbeddingModelConfig, { provider: "langchain" }>
): ConfigReturnType["langchain"];

// Implementation - no return type annotation needed!
export function getEmbeddingModel(config: EmbeddingModelConfig) {
  if (config.provider === "lmstudio") {
    return getLmstudioEmbeddingModel(config); // No 'as' assertion needed!
  }

  if (config.provider === "langchain") {
    return getLangchainEmbeddingModel(config); // No 'as' assertion needed!
  }

  throw new Error("Unsupported provider");
}
