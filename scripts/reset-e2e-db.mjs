import { execSync } from "node:child_process";

const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL || "";

if (!E2E_DATABASE_URL.startsWith("postgresql://")) {
  throw new Error(
    "E2E_DATABASE_URL must be a PostgreSQL URL (postgresql://...) that points to a dedicated test database."
  );
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to reset E2E database in production mode.");
}

const env = {
  ...process.env,
  DATABASE_URL: E2E_DATABASE_URL,
};

execSync("corepack pnpm prisma migrate reset --force --skip-seed --skip-generate", {
  cwd: process.cwd(),
  stdio: "inherit",
  env,
});

console.log("[e2e] reset PostgreSQL test database");
