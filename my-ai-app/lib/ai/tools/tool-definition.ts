import type { InferUITools, ToolSet, UIDataTypes, UIMessage } from "ai";
import { getInformationTool } from "@/lib/ai/tools/get-information";

export const ChatTools = {
  getInformationTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof ChatTools>;

export type CustomChatMessage = UIMessage<never, UIDataTypes, ChatTools>;
