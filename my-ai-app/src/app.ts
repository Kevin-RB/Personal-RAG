import { convertToModelMessages, generateText } from "ai";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { ragAgent } from "../lib/ai/agents/rag-agent";
import { lmstudioModel } from "../lib/ai/provider-config";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/models", async (res: Response) => {
  const models = await fetch("http://127.0.0.1:1234/v1/models");
  console.log(models);
  const data = await models.json();
  res.json(data);
});

app.get("/test", async (res: Response) => {
  const { text } = await generateText({
    model: lmstudioModel("google/gemma-2-9b"),
    prompt: "Write a vegetarian lasagna recipe for 4 people.",
    maxRetries: 1,
  });

  res.send(text);
});

app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!(messages && Array.isArray(messages))) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const result = await ragAgent.stream({
      messages: await convertToModelMessages(messages),
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    console.error("Error in /api/chat:", error);

    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
