import { integer, pgTable, varchar, pgEnum } from "drizzle-orm/pg-core";

export const speciesEnum = pgEnum("species", ["tree frog", "bullfrog", "poison dart frog"]);

export const frogsTable = pgTable("frogs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  species: speciesEnum('family').notNull().default("tree frog"),
  email: varchar({ length: 255 }).notNull().unique(),
  color: varchar({ length: 100 }).notNull(),
});