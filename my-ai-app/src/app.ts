import { convertToModelMessages, type LanguageModel } from "ai";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { RAG_agent } from "../lib/ai/agents/rag-agent";
import { modelList } from "../lib/ai/models";
import type { CustomChatMessage } from "../lib/ai/tools/tool-definition";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.post("/api/chat", (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages: CustomChatMessage[] };

    const modelMessages = convertToModelMessages(messages);

    const agent = RAG_agent({ model: modelList.useOllama as LanguageModel });

    const result = agent.stream({
      messages: modelMessages,
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    console.error("Error occurred while processing request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
