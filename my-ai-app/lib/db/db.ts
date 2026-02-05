import { drizzle } from "drizzle-orm/node-postgres";

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  console.log("Retrieved DATABASE_URL from environment variables.");
  console.log("DATABASE_URL value:", databaseUrl);

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("Using database URL:", databaseUrl);
  return databaseUrl;
}

export const db = drizzle(`${getDatabaseUrl()}?sslmode=disable`);
