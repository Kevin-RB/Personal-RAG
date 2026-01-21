import { ToolLoopAgent } from "ai";
import { lmstudioModel } from "../provider-config";
import { ChatTools } from "../tools/tool-definition";

export const ragAgent = new ToolLoopAgent({
  model: lmstudioModel("google/gemma-2-9b"),
  instructions: "You are a helpful assistant",
  tools: ChatTools,
});
