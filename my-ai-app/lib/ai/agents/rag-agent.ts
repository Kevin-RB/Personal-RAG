import { ToolLoopAgent } from "ai";
import { modelList } from "../models";
import { getInformationTool } from "../tools/get-information";
import { laxSytemPrompt } from "./system-propmts";

export const RAG_agent = new ToolLoopAgent({
  model: modelList.useOllama,
  instructions: laxSytemPrompt,
  tools: {
    getInformationTool,
  },
});
