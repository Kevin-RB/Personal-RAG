import {
  type ExpandedQueries,
  ExpandedQueriesSchema,
} from "@/lib/ai/types/rag";
import { LmstudioClientModel } from "@/lib/ai/utils/provider-config";

export type QueryExpansionOptions = {
  originalQuery: string;
  gaps?: string[];
  iterationCount: number;
};

export async function expandQuery({
  originalQuery,
  gaps = [],
}: QueryExpansionOptions): Promise<ExpandedQueries> {
  const hasGaps = gaps.length > 0;

  const systemPrompt = hasGaps
    ? "You are a query expansion expert. Your task is to generate improved search queries based on identified gaps in previous retrieval results. Focus on creating variations that specifically address the missing information."
    : "You are a query expansion expert. Your task is to generate multiple variations of the search query to improve document retrieval. Create diverse variations using different strategies.";

  const userPrompt = hasGaps
    ? `Original query: "${originalQuery}"

Identified gaps in previous retrieval:
${gaps.map((gap, i) => `${i + 1}. ${gap}`).join("\n")}

Generate 3-5 improved query variations that specifically address these gaps. Each variation should use a different approach to find the missing information.`
    : `Original query: "${originalQuery}"

Generate 3-5 query variations using different strategies:
- broader: More general terms to cast a wider net
- narrower: More specific terms for focused results
- semantic: Reword using synonyms or different phrasing
- gap_based: Address potential missing context

Each variation should help find different aspects or interpretations of the original query.`;

  const model = await LmstudioClientModel("google/gemma-2-9b");
  const output = await model.respond(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      structured: ExpandedQueriesSchema,
    }
  );
  // const { output } = await generateText({
  //   model: lmstudioModel("google/gemma-2-9b"),
  //   output: Output.object({
  //     schema: ExpandedQueriesSchema,
  //   }),
  //   system: systemPrompt,
  //   prompt: userPrompt,
  // });
  return output.parsed;
}

export function selectBestQuery(
  expansions: ExpandedQueries,
  previousQueries: string[]
): string {
  // Filter out queries we've already tried
  const newQueries = expansions.variations.filter(
    (v) => !previousQueries.includes(v.query)
  );

  if (newQueries.length === 0) {
    // If all variations were tried, return the first one anyway
    return expansions.variations[0].query;
  }

  // Prioritize gap_based strategies first, then semantic, then others
  const priorityOrder = ["gap_based", "semantic", "broader", "narrower"];

  for (const strategy of priorityOrder) {
    const match = newQueries.find((v) => v.strategy === strategy);
    if (match) {
      return match.query;
    }
  }

  // Fallback to first available
  return newQueries[0].query;
}
