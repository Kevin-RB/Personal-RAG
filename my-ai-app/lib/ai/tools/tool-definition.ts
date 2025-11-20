import type { InferUITools, ToolSet, UIDataTypes, UIMessage } from "ai";
import { getInformationTool } from "./get-information";

export const ChatTools = {
  // createResourceTool: createResourceTool,
  getInformationTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof ChatTools>;

export type CustomChatMessage = UIMessage<never, UIDataTypes, ChatTools>;
