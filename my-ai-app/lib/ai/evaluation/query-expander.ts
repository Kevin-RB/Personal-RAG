import { generateText, Output } from "ai";
import {
  type ExpandedQueries,
  ExpandedQueriesSchema,
} from "@/lib/ai/types/rag";
import { lmstudioModel } from "@/lib/ai/utils/provider-config";

export type QueryExpansionOptions = {
  originalQuery: string;
  triedQueries?: string[];
  gaps?: string[];
};

export async function expandQuery({
  originalQuery,
  gaps = [],
  triedQueries = [],
}: QueryExpansionOptions): Promise<ExpandedQueries> {
  const hasGaps = gaps.length > 0;

  const systemPrompt = `You are a query expansion assistant. Take brief user queries and expand them into more detailed, comprehensive versions that:
    1. Add relevant context and clarifications
    2. Include related terminology and concepts
    3. Specify what aspects should be covered
    4. Maintain the original intent
    5. Keep it as a single, coherent question

    Expand the query to be 2-3x more detailed while staying focused.
    `;

  const userPrompt = hasGaps
    ? `Original query: "${originalQuery}"

    Identified gaps in previous retrieval:
    ${gaps.map((gap, i) => `${i + 1}. ${gap}`).join("\n")}

    Generate 3-5 improved query variations that specifically address these gaps. Each variation should use a different approach to find the missing information.`
    : `Original query: "${originalQuery}"

    ${triedQueries.length > 0 ? `Previously tried queries:\n${triedQueries.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n` : ""}

    Generate query variations using different strategies:
    - broader: More general terms to cast a wider net
    - narrower: More specific terms for focused results
    - semantic: Reword using synonyms or different phrasing
    - gap_based: Address potential missing context

    Each variation should help find different aspects or interpretations of the original query.`;

  const { output } = await generateText({
    model: lmstudioModel("google/gemma-2-9b"),
    output: Output.object({
      schema: ExpandedQueriesSchema,
    }),
    system: systemPrompt,
    prompt: userPrompt,
  });

  const { success, data } = ExpandedQueriesSchema.safeParse(output);

  if (!success) {
    console.error("Failed to parse expanded queries:", data);
    throw new Error("Invalid expanded queries output");
  }

  return data;
}
