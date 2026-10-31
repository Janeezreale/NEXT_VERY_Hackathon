import type { Metadata } from "next";

import { LoginForm } from "../_components/login-form";
import { redirectIfSignedIn } from "../_lib/signed-in";

export const metadata: Metadata = { title: "로그인" };

const ERROR_MESSAGES: Record<string, string> = {
  confirm: "인증 링크가 만료됐거나 올바르지 않아요. 다시 가입하거나 로그인해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  await redirectIfSignedIn();
  const { error } = await searchParams;
  const initialError = typeof error === "string" ? (ERROR_MESSAGES[error] ?? null) : null;

  return (
    <section
      aria-labelledby="login-title"
      className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6"
    >
      <h1
        id="login-title"
        className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground lg:text-[32px] lg:leading-10"
      >
        로그인
      </h1>
      <p className="mt-2 mb-6 text-sm leading-5 text-muted-foreground">
        가입한 이메일과 비밀번호로 로그인해 주세요.
      </p>
      <LoginForm initialError={initialError} />
    </section>
  );
}
