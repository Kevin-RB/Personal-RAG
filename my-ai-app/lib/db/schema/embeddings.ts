import {
  index,
  integer,
  pgTable,
  text,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { resources } from "@/lib/db/schema/resources";

export const embeddings = pgTable(
  "embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 2000 }).notNull(),
    pageNumber: integer("page_number").notNull(),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
