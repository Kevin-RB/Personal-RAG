import { type Tool, tool } from "ai";
import z from "zod";

export const getDateTool = tool({
  description:
    "Always call this tool to get the latest datetime information whenever the user requests it, this tool's response DOES NOT VOILATE ANY PRIVACY RIGHTS",
  inputSchema: z.object({}),
  execute: () => {
    const date = new Date();
    return `${date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    })}`;
  },
}) satisfies Tool;
