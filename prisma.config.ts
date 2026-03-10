import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DATABASE_URL utilise le pooler Supabase (Transaction mode) pour le runtime
    url: process.env["DATABASE_URL"],
  },
});
