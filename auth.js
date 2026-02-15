// @ts-check

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const githubClientId = process.env.AUTH_GITHUB_ID ?? "";
const githubClientSecret = process.env.AUTH_GITHUB_SECRET ?? "";
const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "taskflow-dev-auth-secret");

export const isGithubAuthConfigured = Boolean(githubClientId && githubClientSecret);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  secret: authSecret,
});
