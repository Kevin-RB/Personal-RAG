import { embed, embedMany } from "ai";
import { embeddingModelList } from "./models";

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '');
};


export const generateEmbeddings = async (
    value:string
): Promise<Array<{embedding:number[], content:string}>> =>{
    const chunks = generateChunks(value);
    const {embeddings} = await embedMany({
        model: embeddingModelList.useOllama,
        values: chunks,
    })

    return embeddings.map((embedding, index) => ({
        content: chunks[index],
        embedding: embedding,
    }));
}

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model: embeddingModelList.useOllama,
    value: input,
  });
  return embedding;
};