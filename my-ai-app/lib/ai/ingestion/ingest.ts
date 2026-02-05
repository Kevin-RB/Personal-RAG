import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStorePGVector } from "@/lib/ai/utils/vector-store";

export const IngestKnowledgeBase = async () => {
  try {
    const filePath = process.env.FILE_PATH;

    if (!filePath) {
      throw new Error("FILE_PATH environment variable is not set.");
    }

    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    console.log(docs[0].pageContent);
    console.log(docs[0].metadata);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const allSplits = await textSplitter.splitDocuments(docs);

    await vectorStorePGVector.addDocuments(allSplits);
    process.exit(0);
  } catch (error) {
    console.error("Error during manual ingestion:", error);
    throw error;
  }
};

IngestKnowledgeBase();
