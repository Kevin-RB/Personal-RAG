import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { embeddings as embeddingsTable } from "../../db/schema/embeddings";
import { embedMany } from "ai";
import { db } from "../../db/db";
import { insertResourceSchema, resources } from "../../db/schema/resources";
import { embeddingModelList } from "../models";

export const ManuelIngestingest = async () => {
    try {
    const loader = new PDFLoader(process.env.MANUAL_INGESTION_PATH || '');
    const docs = await loader.load()

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
    const document = await splitter.splitDocuments(docs);
    console.log(document);

    const contents = document.map(doc => doc.pageContent);

    const {embeddings} = await embedMany({
        model: embeddingModelList.useOllama,
        values: contents,
    })

    const dbEmbeddings = embeddings.map((embedding, index) => ({
        content: contents[index],
        embedding: embedding,
    }));

    // get file name from path
    const fileName = docs[0].metadata.source.split('\\').pop();

    const { content } = insertResourceSchema.parse({content: fileName|| 'unknown'});

    const [resource] = await db
    .insert(resources)
    .values({
        content,
    })
    .returning();

    await db.insert(embeddingsTable).values(
        dbEmbeddings.map(embedding => ({
            resourceId: resource.id,
            content: embedding.content,
            embedding: embedding.embedding,
        }))
    )
} catch (error) {
    console.error("Error during manual ingestion:", error);
}
}
// ManuelIngestingest();

export const ingestFile = async (dataURL: Base64URLString): Promise<void> => {
    try {
        // Extract the base64 part from the dataURL
        const base64Data = dataURL.split(',')[1];
        if (!base64Data) {
            throw new Error('Invalid dataURL format');
        }

        // Decode base64 to Buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Create a Blob from the Buffer
        const blob = new Blob([buffer], { type: 'application/pdf' });

        // Load the PDF using PDFLoader with the Blob
        const loader = new PDFLoader(blob);
        const docs = await loader.load();

        if (docs.length === 0) {
            throw new Error('No documents loaded from PDF');
        }

        // Split the text
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const texts = await splitter.splitText(docs[0].pageContent);

        // Generate embeddings
        const { embeddings } = await embedMany({
            model: embeddingModelList.useOllama,
            values: texts,
        });

        // Prepare embeddings for database insertion
        const dbEmbeddings = embeddings.map((embedding, index) => ({
            content: texts[index],
            embedding,
        }));

        // Validate and insert resource
        const { content } = insertResourceSchema.parse({ content: 'uploaded-pdf' }); // Customize content as needed

        const [resource] = await db
            .insert(resources)
            .values({ content })
            .returning();

        // Insert embeddings
        await db.insert(embeddingsTable).values(
            dbEmbeddings.map((embedding) => ({
                resourceId: resource.id,
                content: embedding.content,
                embedding: embedding.embedding,
            }))
        );

        console.log('Ingestion completed successfully');
    } catch (error) {
        console.error('Error during ingestion:', error);
        throw error; // Re-throw for caller to handle
    }
};