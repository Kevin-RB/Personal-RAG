import { generateObject } from "ai";
import z from "zod";
import { modelList } from "@/lib/ai/models";

export const generateVariants = async (question: string) => {
  const { object } = await generateObject({
    model: modelList.useOllama,
    output: "object",
    schema: z.object({
      variants: z.array(z.string().min(50).max(200)).max(4),
    }),
    prompt: question,
    system: `
            Create variations of this question so that the semantic range can be amplified.
            `,
  });

  console.log("Generated object:", JSON.stringify(object, null, 2));
  return object;
};
