import { pipeAgentUIStreamToResponse } from "ai";
import cors from "cors";
import express, { type Request, type Response } from "express";
import z from "zod/v3";
import { ragAgent } from "@/lib/ai/agents/rag-agent";
import { LmstudioClientModel } from "@/lib/ai/utils/provider-config";

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
    const responseSchema = z.object({
      variations: z.array(
        z.object({
          query: z.string(),
        })
      ),
    });

    const model = await LmstudioClientModel("google/gemma-2-9b");

    const result = await model.respond(
      "Generate variations of the query: A lily is.",
      { structured: responseSchema }
    );
    const structuredResponse = result.parsed;
    console.log("Structured response:", structuredResponse);
    res.json(structuredResponse);
  } catch (error) {
    console.error("Error in /api/test:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
