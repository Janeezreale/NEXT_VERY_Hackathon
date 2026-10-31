import type { Metadata } from "next";

import { LoginForm } from "../_components/login-form";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
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
      <LoginForm />
    </section>
  );
}
