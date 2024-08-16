import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/database/schema/index.ts",
  out: "./lib/database/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL!,
  },
  verbose: true,
  strict: true,
});
