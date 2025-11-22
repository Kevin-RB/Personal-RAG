import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { db } from "../../db/db";
import { embeddings as embeddingsTable } from "../../db/schema/embeddings";
import { insertResourceSchema, resources } from "../../db/schema/resources";
import { generateEmbeddingsFromChunks } from "../embeddings";

export const ManualIngest = async () => {
  try {
    const loader = new PDFLoader(process.env.MANUAL_INGESTION_PATH || "", {
      parsedItemSeparator: "",
      splitPages: true,
    });

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    console.log(`📦 Split into ${splitDocs.length} chunks`);
    console.log(`📄 Sample chunk: ${JSON.stringify(splitDocs[0], null, 2)}`);

    const contents = splitDocs.map((doc) => doc.pageContent);
    const dbEmbeddings = await generateEmbeddingsFromChunks(contents);

    const enrichedEmbeddings = dbEmbeddings.map((embedding, index) => ({
      ...embedding,
      pageNumber: splitDocs[index].metadata?.loc?.pageNumber,
    }));

    // Get file name from path
    const fileName =
      docs[0].metadata.source.split("\\").pop() ||
      docs[0].metadata.source.split("/").pop();

    const { content, author, title, subject, keywords } =
      insertResourceSchema.parse({
        content: fileName || "unknown",
        author: docs[0].metadata?.pdf?.info?.Author || null,
        title: docs[0].metadata?.pdf?.info?.Title || null,
        subject: docs[0].metadata?.pdf?.info?.Subject || null,
        keywords: docs[0].metadata?.pdf?.info?.Keywords || null,
      });

    const [resource] = await db
      .insert(resources)
      .values({
        content,
        author,
        title,
        subject,
        keywords,
      })
      .returning();

    await db.insert(embeddingsTable).values(
      enrichedEmbeddings.map((embedding) => ({
        resourceId: resource.id,
        content: embedding.content,
        embedding: embedding.embedding,
        pageNumber: embedding.pageNumber,
      }))
    );
  } catch (error) {
    console.error("Error during manual ingestion:", error);
  }
};
