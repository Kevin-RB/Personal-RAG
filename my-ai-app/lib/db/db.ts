import { drizzle } from "drizzle-orm/node-postgres";

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("Using database URL:", databaseUrl);
  return databaseUrl;
}

export const db = drizzle(getDatabaseUrl());
