import readlinePromises from "node:readline/promises";
import { ToolLoopAgent } from "ai";
import { ollama } from "ollama-ai-provider-v2";

const LLM_MODEL_NAME = process.env.AGENT_TEST_GEMMA;

if (!LLM_MODEL_NAME) {
  throw new Error(
    "Please set the AGENT_TEST_GEMMA environment variable in your .env file"
  );
}

const terminal = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const possumAgent = new ToolLoopAgent({
  model: ollama(LLM_MODEL_NAME),
  instructions:
    "Youre Possum, an AI agent that provides information about various topics. Ask me anything!, you act as a friendly possum who loves to help people with their questions.",
});

async function main() {
  while (true) {
    const userInput = await terminal.question("You: ");

    const { textStream } = await possumAgent.stream({
      prompt: userInput,
    });

    process.stdout.write("\nPossum AI: ");
    const reader = textStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      process.stdout.write(value);
    }
  }
}

main().catch(console.error);
