export const IngestFile = () => {
  try {
    console.log("Manual ingestion started.");
  } catch (error) {
    console.error("Error during manual ingestion:", error);
    throw error;
  }
};
