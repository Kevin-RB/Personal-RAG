import { runRetrievalPipeline } from "./pipeline";
import type { RetrievalOptions, RetrievalResult } from "./types";

export type {
  RetrievalOptions,
  RetrievalResult,
  RetrievalState,
} from "./types";

export function retrieveInformation(
  options: RetrievalOptions
): Promise<RetrievalResult> {
  return runRetrievalPipeline(options);
}
