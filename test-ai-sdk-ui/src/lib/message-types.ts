import type { InferUITools, Tool, UIMessage } from "ai";

export type ToolProgressStep =
  | "iteration-start"
  | "queries-ready"
  | "iteration-complete"
  | "complete"
  | "generating-summary";

// Simplified progress output for tool results (used by InferAgentUIMessage)
// Copy this type to your frontend
export type ToolProgressOutput = {
  step: ToolProgressStep;
  message: string;
  iteration?: number;
};

export type RagAgentUIMessage = UIMessage<
  unknown,
  never,
  InferUITools<{
    getInformationTool: Tool<
      {
        query: string;
      },
      ToolProgressOutput
    >;
  }>
>;
