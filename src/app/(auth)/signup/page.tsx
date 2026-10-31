import type { Metadata } from "next";

import { SignupForm } from "../_components/signup-form";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <section
      aria-labelledby="signup-title"
      className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6"
    >
      <h1
        id="signup-title"
        className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground lg:text-[32px] lg:leading-10"
      >
        회원가입
      </h1>
      <p className="mt-2 mb-6 text-sm leading-5 text-muted-foreground">
        가입 유형을 고르고 이메일로 계정을 만들어 주세요.
      </p>
      <SignupForm />
    </section>
  );
}
