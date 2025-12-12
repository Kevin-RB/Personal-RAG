import { Experimental_Agent as Agent, stepCountIs } from "ai";
import { evalite } from "evalite";
import { levenshtein } from "evalite/scorers";
import { laxSytemPrompt } from "../lib/ai/agents/system-propmts";
import { getDateTool } from "../lib/ai/tools/get-date";
import { testingModels } from "./evalite-models";

evalite("Datetime Understanding Eval", {
  data: () => [
    {
      input: "What is the current date and time?",
      expected: {
        reference: `The current date and time is ${new Date().toLocaleDateString(
          "en-US",
          {
            day: "numeric",
            month: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
          }
        )}`,
      },
    },
  ],
  task: async (input) => {
    const agent = new Agent({
      model: testingModels.ollama,
      system: laxSytemPrompt,
      tools: {
        getDateTool,
      },
      stopWhen: stepCountIs(10),
    });

    const response = await agent.generate({
      prompt: input,
    });

    return response.text;
  },
  scorers: [
    {
      scorer: ({ output, expected }) =>
        levenshtein({
          actual: output,
          expected: expected.reference,
        }),
    },
  ],
});
