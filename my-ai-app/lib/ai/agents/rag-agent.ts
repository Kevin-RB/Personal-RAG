import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import { lmstudioModel } from "../provider-config";

export const ragAgent = new ToolLoopAgent({
  model: lmstudioModel("google/gemma-2-9b"),
  instructions: "You are a helpful assistant",
  tools: {
    weather: tool({
      description: "Get the weather in a location",
      inputSchema: z.object({
        location: z.string().describe("The location to get the weather for"),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
});
