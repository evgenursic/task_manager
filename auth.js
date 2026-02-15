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
  callbacks: {
    async jwt({ token, profile, user }) {
      if (user?.id && !token.sub) {
        token.sub = String(user.id);
      } else if (profile?.id && !token.sub) {
        token.sub = String(profile.id);
      }

      return token;
    },
    async session({ session, token }) {
      const sessionWithId = /** @type {any} */ (session);
      if (sessionWithId.user && token.sub) {
        sessionWithId.user.id = String(token.sub);
      }
      return sessionWithId;
    },
  },
  trustHost: true,
  secret: authSecret,
});
