import { pipeAgentUIStreamToResponse } from "ai";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { ragAgent } from "@/lib/ai/agents/rag-agent";
import { vectorStorePGVector } from "@/lib/ai/utils/vector-store";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.post("/api/chat", (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!(messages && Array.isArray(messages))) {
    return res.status(400).json({ error: "Messages array is required" });
  }
  try {
    return pipeAgentUIStreamToResponse({
      response: res,
      agent: ragAgent,
      uiMessages: messages,
      sendReasoning: true,
      sendSources: true,
      onStepFinish: (step) => {
        console.log(
          "Step finished:",
          step.toolCalls.length,
          "tool calls made so far"
        );
      },
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);

    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

app.get("/api/test", async (req: Request, res: Response) => {
  console.log("Received request to /api/test", req.query);
  try {
    const iterationQueries = [
      "Who is Camila Dossman",
      "What is Camila Dossman's background and experience",
    ];
    const result = await Promise.all(
      iterationQueries.map((query) =>
        vectorStorePGVector.similaritySearch(query, 5, {
          source: {
            in: [
              "C:\\Users\\KRB35\\personal-projects\\ai-sdk-playground\\rag-document-repository\\Maria Camila Dossman CV English AUS copy.pdf",
              "micos lindos",
            ],
          },
        })
      )
    );

    res.json(result);
  } catch (error) {
    console.error("Error in /api/test:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
