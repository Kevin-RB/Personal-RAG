DROP INDEX "embeddingIndex";--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "embeddings" USING ivfflat ("embedding" halfvec_l2_ops) WITH (list=100);