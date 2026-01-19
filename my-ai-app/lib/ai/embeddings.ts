import { embed, embedMany } from "ai";

export const generateEmbeddingsFromChunks = async (
  contents: string[]
): Promise<Array<{ embedding: number[]; content: string }>> =>
  await embeddContent(contents);

const embeddContent = async (
  chunks: string[]
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const { embeddings } = await embedMany({
    model: "test",
    values: chunks,
  });

  return embeddings.map((embedding, index) => ({
    content: chunks[index],
    embedding,
  }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: "test",
    value: input,
  });
  return embedding;
};
