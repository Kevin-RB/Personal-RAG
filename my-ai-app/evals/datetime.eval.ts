import { evalite } from "evalite";
import { levenshtein } from "evalite/scorers";
import { RAG_agent_evalite } from "./evalite-models";

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
    const response = await RAG_agent_evalite.generate({
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
