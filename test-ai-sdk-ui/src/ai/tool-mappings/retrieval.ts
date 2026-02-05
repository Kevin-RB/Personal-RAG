import type { ToolUIPart } from "ai";

type RetrievalToolInput = {
  query: string;
};

type RetrievalToolOutput = {
  location: string;
  temperature: string;
  conditions: string;
  humidity: string;
  windSpeed: string;
  lastUpdated: string;
};

export type RetrievalToolUIPart = ToolUIPart<{
  fetch_Retrieval_data: {
    input: RetrievalToolInput;
    output: RetrievalToolOutput;
  };
}>;
