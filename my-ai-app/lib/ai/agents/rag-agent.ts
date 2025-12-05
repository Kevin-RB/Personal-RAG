import { ToolLoopAgent } from "ai";
import type { testingModels } from "../../../evals/evalite-models";
import { getDateTool } from "../tools/get-date";
import { getInformationTool } from "../tools/get-information";
import { laxSytemPrompt } from "./system-propmts";

export function RAG_agent({ model }: { model: testingModels }) {
  return new ToolLoopAgent({
    model,
    instructions: laxSytemPrompt,
    tools: {
      getInformationTool,
      getDateTool,
    },
  });
}
