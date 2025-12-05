import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";

const runMigrate = async () => {
  console.log("🚀 Starting migration script");
  process.loadEnvFile(".env");

  console.log("⏳ Running migrations...");

  const start = Date.now();

  await migrate(db, { migrationsFolder: "lib/db/migrations" });

  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");

  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
