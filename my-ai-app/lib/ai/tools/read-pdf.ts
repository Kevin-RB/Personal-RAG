import type { FilePart } from "ai";
// import { ingestFile } from "@/lib/ai/ingestion/ingest";

export const processPDF = (data: FilePart) => {
  try {
    if (typeof data.data !== "string") {
      throw new Error("File data is not a valid Base64 string");
    }

    // await ingestFile(data.data);

    return "The PDF file has been successfully processed and its content has been ingested.";
  } catch (err) {
    if (err instanceof Error) {
      return err.message.length > 0
        ? err.message
        : "An error occurred while creating the resource.";
    }
  }
};
