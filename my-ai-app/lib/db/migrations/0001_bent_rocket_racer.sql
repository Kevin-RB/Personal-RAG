ALTER TABLE "embeddings" ADD COLUMN "page_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "keywords" text;