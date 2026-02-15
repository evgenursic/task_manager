import { redirect } from "next/navigation";
import { auth, isGithubAuthConfigured } from "@/auth";
import { LoginCard } from "./login-card";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/tasks");
  }

  return (
    <section className="py-8 sm:py-14">
      <LoginCard authConfigured={isGithubAuthConfigured} />
    </section>
  );
}
