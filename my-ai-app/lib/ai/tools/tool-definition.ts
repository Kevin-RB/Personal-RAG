import {
    type InferUITools,
    type ToolSet,
    type UIDataTypes,
    type UIMessage
} from "ai";
import { createResourceTool } from "./create-resources";
import { getInformationTool } from "./get-information";

export const ChatTools = {
    // createResourceTool: createResourceTool,
    getInformationTool: getInformationTool,
} satisfies ToolSet

export type ChatTools = InferUITools<typeof ChatTools>;

export type CustomChatMessage = UIMessage<never, UIDataTypes, ChatTools>;