import type { RAGTelemetry, RetrievalEvaluation } from "@/lib/ai/types/rag";

export class RAGTelemetryCollector {
  private readonly telemetry: RAGTelemetry;

  constructor(queryId: string, originalQuery: string) {
    this.telemetry = {
      queryId,
      originalQuery,
      startTime: new Date(),
      iterations: [],
      queryExpansions: [],
      finalConfidence: 0,
    };
  }

  recordIteration(options: {
    iterationNumber: number;
    query: string;
    evaluation: RetrievalEvaluation;
    documentsRetrieved: number;
  }): void {
    this.telemetry.iterations.push({
      iterationNumber: options.iterationNumber,
      query: options.query,
      evaluation: options.evaluation,
      documentsRetrieved: options.documentsRetrieved,
      timestamp: new Date(),
    });
  }

  recordQueryExpansion(options: {
    fromQuery: string;
    toQuery: string;
    reason: string;
  }): void {
    this.telemetry.queryExpansions.push({
      fromQuery: options.fromQuery,
      toQuery: options.toQuery,
      reason: options.reason,
      timestamp: new Date(),
    });
  }

  setFinalConfidence(confidence: number): void {
    this.telemetry.finalConfidence = confidence;
  }

  setTokenUsage(input: number, output: number): void {
    this.telemetry.totalTokens = { input, output };
  }

  recordError(error: string): void {
    this.telemetry.error = error;
  }

  finalize(): RAGTelemetry {
    this.telemetry.endTime = new Date();
    return { ...this.telemetry };
  }

  getCurrentState(): Partial<RAGTelemetry> {
    return {
      queryId: this.telemetry.queryId,
      originalQuery: this.telemetry.originalQuery,
      iterations: [...this.telemetry.iterations],
      queryExpansions: [...this.telemetry.queryExpansions],
    };
  }
}

export function generateQueryId(): string {
  return `rag_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function logTelemetry(telemetry: RAGTelemetry): void {
  const duration = telemetry.endTime
    ? telemetry.endTime.getTime() - telemetry.startTime.getTime()
    : 0;

  console.log("=== RAG Telemetry ===");
  console.log(`Query ID: ${telemetry.queryId}`);
  console.log(`Original Query: ${telemetry.originalQuery}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Iterations: ${telemetry.iterations.length}`);
  console.log(`Query Expansions: ${telemetry.queryExpansions.length}`);
  console.log(`Final Confidence: ${telemetry.finalConfidence.toFixed(2)}`);

  if (telemetry.totalTokens) {
    console.log(
      `Tokens: ${telemetry.totalTokens.input} input, ${telemetry.totalTokens.output} output`
    );
  }

  for (const iter of telemetry.iterations) {
    console.log(
      `  Iteration ${iter.iterationNumber}: confidence=${iter.evaluation.confidence.toFixed(2)}, docs=${iter.documentsRetrieved}`
    );
  }

  if (telemetry.error) {
    console.error(`Error: ${telemetry.error}`);
  }

  console.log("====================");
}
