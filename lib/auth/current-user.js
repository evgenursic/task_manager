// @ts-check

import { auth } from "@/auth";
import { db } from "@/lib/db";

const E2E_FALLBACK_EMAIL = "e2e-user@taskflow.local";

/**
 * @typedef {import("@prisma/client").PrismaClient} PrismaClient
 */

/**
 * @param {unknown} value
 */
function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * @param {string | null} authUserId
 */
function toSyntheticEmail(authUserId) {
  if (!authUserId) {
    return null;
  }

  return `github-${authUserId}@users.taskflow.local`;
}

/**
 * @param {string} email
 * @param {string | null} name
 * @param {string | null} image
 * @param {PrismaClient} client
 */
async function upsertUserByEmail(email, name, image, client) {
  return client.user.upsert({
    where: { email },
    update: { name, image },
    create: { email, name, image },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  });
}

/**
 * Resolve current DB user based on Auth.js session. Returns null when user is not signed in.
 * @param {PrismaClient} [client]
 */
export async function getCurrentOwner(client = db) {
  const session = await auth();
  const sessionUser = /** @type {any} */ (session?.user ?? null);

  if (!sessionUser) {
    if (process.env.E2E_BYPASS_AUTH === "1") {
      return upsertUserByEmail(E2E_FALLBACK_EMAIL, "E2E User", null, client);
    }
    return null;
  }

  const name = normalizeOptionalText(sessionUser.name);
  const image = normalizeOptionalText(sessionUser.image);
  const emailFromSession = normalizeOptionalText(sessionUser.email);
  const authUserId = normalizeOptionalText(sessionUser.id);
  const email = emailFromSession ?? toSyntheticEmail(authUserId);

  if (!email) {
    return null;
  }

  return upsertUserByEmail(email, name, image, client);
}
