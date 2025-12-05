import type { InferUITools, ToolSet, UIDataTypes, UIMessage } from "ai";
import { getDateTool } from "./get-date";
import { getInformationTool } from "./get-information";

export const ChatTools = {
  getInformationTool,
  getDateTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof ChatTools>;

export type CustomChatMessage = UIMessage<never, UIDataTypes, ChatTools>;
