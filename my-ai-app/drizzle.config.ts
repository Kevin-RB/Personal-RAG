import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./lib/db/db";

export default defineConfig({
  out: "./lib/db/migrations",
  schema: "./lib/db/schema/*",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
