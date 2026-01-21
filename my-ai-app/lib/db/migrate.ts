import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";

const runMigrate = async () => {
  try {
    console.log("🚀 Starting migration script");

    console.log("⏳ Running migrations...");

    const start = Date.now();

    await migrate(db, { migrationsFolder: "lib/db/migrations" });

    const end = Date.now();

    console.log("✅ Migrations completed in", end - start, "ms");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  }
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
