// @ts-check

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";

const githubClientId = process.env.AUTH_GITHUB_ID ?? "";
const githubClientSecret = process.env.AUTH_GITHUB_SECRET ?? "";
const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "taskflow-dev-auth-secret");

export const isGithubAuthConfigured = Boolean(githubClientId && githubClientSecret);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      const sessionWithId = /** @type {any} */ (session);
      if (sessionWithId.user && user?.id) {
        sessionWithId.user.id = String(user.id);
      }
      return sessionWithId;
    },
  },
  trustHost: true,
  secret: authSecret,
});
