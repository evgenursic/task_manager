import { execSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL || "file:./e2e.db";

if (!E2E_DATABASE_URL.startsWith("file:")) {
  throw new Error("E2E_DATABASE_URL must use sqlite file: URL, e.g. file:./e2e.db");
}

const dbRelativePath = E2E_DATABASE_URL.slice("file:".length);
const dbAbsolutePath = dbRelativePath.startsWith("./")
  ? path.resolve(process.cwd(), "prisma", dbRelativePath.slice(2))
  : path.resolve(process.cwd(), dbRelativePath);

await mkdir(path.dirname(dbAbsolutePath), { recursive: true });

for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  await rm(`${dbAbsolutePath}${suffix}`, { force: true });
}

// Prisma can fail to create a brand-new SQLite file in some Windows setups.
await writeFile(dbAbsolutePath, "");

const env = {
  ...process.env,
  DATABASE_URL: E2E_DATABASE_URL,
};

execSync("corepack pnpm prisma db push --skip-generate", {
  cwd: process.cwd(),
  stdio: "inherit",
  env,
});

console.log(`[e2e] reset database at ${dbRelativePath}`);
