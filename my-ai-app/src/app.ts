import { convertToModelMessages } from "ai";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { ragAgent } from "@/lib/ai/agents/rag-agent";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

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
