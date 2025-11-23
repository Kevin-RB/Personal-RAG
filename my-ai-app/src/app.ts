import { pipeAgentUIStreamToResponse } from "ai";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { RAG_agent } from "../lib/ai/agents/rag-agent";
import type { CustomChatMessage } from "../lib/ai/tools/tool-definition";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages: CustomChatMessage[] };

    // currentrly AI-SDK is expecting the message as the type returned from useChat
    // const modelMessages = convertToModelMessages(messages);

    await pipeAgentUIStreamToResponse({
      response: res,
      agent: RAG_agent,
      messages,
    });
  } catch (error) {
    console.error("Error occurred while processing request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
