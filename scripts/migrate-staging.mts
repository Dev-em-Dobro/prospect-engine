// Aplica migrations no Neon de staging (DATABASE_URL_STAGING).
// Uso: npm run db:migrate:staging
// Nunca aponta para DATABASE_URL de produção.

import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config();

const staging = process.env.DATABASE_URL_STAGING?.trim();
if (!staging) {
  console.error("DATABASE_URL_STAGING ausente no .env");
  process.exit(1);
}

process.env.DATABASE_URL = staging;

const result = spawnSync(
  "npx",
  ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
  { stdio: "inherit", env: process.env, shell: true },
);

process.exit(result.status ?? 1);
