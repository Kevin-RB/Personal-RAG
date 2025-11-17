import { convertToModelMessages, stepCountIs, streamText, tool, FilePart } from 'ai';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createResourceTool } from '../lib/ai/tools/create-resources';
import { userModelMessageSchema } from 'ai';
import { getInformationTool } from '../lib/ai/tools/get-information';
import { CustomChatMessage } from '../lib/ai/tools/tool-definition';
import { processPDF } from '../lib/ai/tools/read-pdf';
import z from 'zod';
import { modelList } from '../lib/ai/models';

const app = express();

app.use(cors())
app.use(express.json({ limit: '5mb' }));


app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {messages}  = req.body as { messages: CustomChatMessage[] };

    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: modelList.useOllama,
      system: `
      You are a helpful assistant.
      
      Use the provided tools to answer user questions as best as you can.
      If you don't know the answer, just say you don't know. Do not make up an answer
      
      If the user provides a PDF document file, use the processPDF tool to ingest its content into your knowledge base before answering any questions related to the document.
      `,
      messages: modelMessages,
      tools: {
        // createResourceTool: createResourceTool,
        getInformationTool: getInformationTool,
        processPDFTool: tool({
            description: `Process a PDF file provided by the user and extract its content for further use.`,
            inputSchema: z.object({}),
            execute: async () => {
              console.log('processPDFTool executed');
              const lastMessage = modelMessages[modelMessages.length - 1] 

              const parsedLastMessage = userModelMessageSchema.safeParse(lastMessage);
              console.log('Parsed last message:', parsedLastMessage);

              if (parsedLastMessage.error) {
                throw new Error('Last message is not from user');
              }
              
              const content = parsedLastMessage.data.content;
              console.log('Content of last message:', content);

              if (!Array.isArray(content)) {
                throw new Error('Last message content is not an array');
              }

              const filePart = content.find(part => part.type === 'file'  && part.mediaType === 'application/pdf') as FilePart | undefined;

              if (!filePart) {
                throw new Error('No PDF file found in the last message');
              }

              console.log('PDF file found:', filePart);

              return await processPDF(filePart)
            },
        }),
      },
      stopWhen: stepCountIs(5),      
      onStepFinish: async ({toolResults})=>{
          if(toolResults.length === 0) return
          console.log(JSON.stringify(toolResults, null, 2))
      },
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    console.error('Error occurred while processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})