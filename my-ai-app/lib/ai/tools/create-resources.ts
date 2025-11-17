import { db } from "../../db/db";
import { insertResourceSchema, NewResourceParams, resources } from "../../db/schema/resources";
import { generateEmbeddings } from "../embeddings";
import { embeddings as embeddingsTable } from "../../db/schema/embeddings";
import { Tool, tool } from "ai";
import z from "zod";

const createResources = async (input:NewResourceParams) =>{
    try{
        const { content } = insertResourceSchema.parse(input);

        const [resource] = await db
        .insert(resources)
        .values({
            content,
        })
        .returning();

        const embeddings = await generateEmbeddings(content);
        await db.insert(embeddingsTable).values(
            embeddings.map(embedding => ({
                resourceId: resource.id,
                content: embedding.content,
                embedding: embedding.embedding,
            }))
        )

        return 'Resource successfully created.';

    } catch(err){
        if (err instanceof Error) {
            return err.message.length > 0 ? err.message : 'An error occurred while creating the resource.';
        }
    }
}

export const createResourceTool = tool({
    description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
    inputSchema: z.object({
        content: z.string().describe("The content of the resource to add to the knowledge base"),
    }),
    execute: async ({content}) => createResources({content}),
}) satisfies Tool;