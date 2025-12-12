import { Experimental_Agent as Agent, type LanguageModel } from "ai";
import { getDateTool } from "../tools/get-date";
import { getInformationTool } from "../tools/get-information";
import { laxSytemPrompt } from "./system-propmts";

export function RAG_agent({ model }: { model: LanguageModel }) {
  const agent = new Agent({
    model,
    tools: {
      getInformationTool,
      getDateTool,
    },
    system: laxSytemPrompt,
  });

  return agent;
}
