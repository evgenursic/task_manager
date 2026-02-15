// @ts-check

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const E2E_FALLBACK_EMAIL = "e2e-user@taskflow.local";
const E2E_USER_COOKIE_NAME = "taskflow-e2e-user-email";

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

async function resolveE2ETestEmail() {
  if (process.env.NODE_ENV === "production" || process.env.E2E_BYPASS_AUTH !== "1") {
    return null;
  }

  const cookieStore = await cookies();
  const cookieEmail = normalizeOptionalText(cookieStore.get(E2E_USER_COOKIE_NAME)?.value);

  if (cookieEmail) {
    return cookieEmail;
  }

  const envEmail = normalizeOptionalText(process.env.E2E_TEST_USER_EMAIL);
  if (envEmail) {
    return envEmail;
  }

  return E2E_FALLBACK_EMAIL;
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
    const e2eEmail = await resolveE2ETestEmail();
    if (e2eEmail) {
      return upsertUserByEmail(e2eEmail, "E2E User", null, client);
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
