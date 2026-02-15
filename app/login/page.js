import { redirect } from "next/navigation";
import { auth, isGithubAuthConfigured } from "@/auth";
import { toSafeNextPath } from "@/lib/auth/safe-next";
import { LoginCard } from "./login-card";

/**
 * @param {{
 *   searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
 * }} props
 */
export default async function LoginPage({ searchParams }) {
  const params = await Promise.resolve(searchParams);
  const rawNextValue = Array.isArray(params?.next) ? params.next[0] : params?.next;
  const nextPath = toSafeNextPath(rawNextValue);
  const session = await auth();

  if (session?.user) {
    redirect(nextPath);
  }

  return (
    <section className="py-8 sm:py-14">
      <LoginCard authConfigured={isGithubAuthConfigured} nextPath={nextPath} />
    </section>
  );
}
