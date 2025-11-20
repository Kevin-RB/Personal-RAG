import type { ToolUIPart } from "ai";

export type GetInformationToolInput = {
  question: string;
};

export type GetInformationToolOutput = {
  content: string;
};

export type GetInformationToolUIPart = ToolUIPart<{
  get_information: {
    input: GetInformationToolInput;
    output: GetInformationToolOutput;
  };
}>;
