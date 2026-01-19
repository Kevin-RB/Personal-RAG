DROP INDEX "embeddingIndex";--> statement-breakpoint
ALTER TABLE "embeddings" ALTER COLUMN "embedding" SET DATA TYPE halfvec(4096);--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "embeddings" USING ivfflat ("embedding" halfvec_l2_ops);