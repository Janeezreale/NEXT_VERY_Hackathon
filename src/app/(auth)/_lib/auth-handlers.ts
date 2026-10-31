"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/src/lib/supabase/env";
import { createClient } from "@/src/lib/supabase/server";

import {
  homePathForRole,
  type FieldErrors,
  validateLogin,
  validateSignup,
  type LoginValues,
  type SignupValues,
} from "./validation";

/**
 * Supabase Auth 이메일/비밀번호 로그인·회원가입·로그아웃(D01 제안: 이메일/비밀번호, seller/buyer).
 *
 * - 입력은 서버에서 다시 검증한다.
 * - 가입 유형은 user_metadata.role로 전달한다. 이 값은 사용자가 바꿀 수 있으므로
 *   첫 화면 이동에만 쓰고, 권한 판단은 총괄이 만드는 profiles.role·RLS·서버 API에서 한다(L03).
 */
export type AuthResult =
  | { ok: true; redirectTo: string }
  | { ok: true; notice: string }
  | { ok: false; formError: string; fieldErrors?: FieldErrors<LoginValues & SignupValues> };

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  formError: "로그인 서버 설정이 아직 없어요. .env.local에 Supabase 연결 정보를 넣어 주세요.",
};

/** Supabase 오류 코드를 사용자 문구로 바꾼다. 원문 오류는 화면에 노출하지 않는다. */
function toMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case "invalid_credentials":
      return "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.";
    case "email_not_confirmed":
      return "이메일 인증이 아직 끝나지 않았어요. 받은 메일의 인증 링크를 눌러 주세요.";
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 이메일이에요. 로그인해 주세요.";
    case "weak_password":
      return "비밀번호가 너무 단순해요. 더 길거나 복잡하게 입력해 주세요.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
    case "signup_disabled":
      return "지금은 회원가입을 받을 수 없어요.";
    default:
      return fallback;
  }
}

export async function submitLogin(values: LoginValues): Promise<AuthResult> {
  const input = { email: String(values.email ?? "").trim(), password: String(values.password ?? "") };
  const fieldErrors = validateLogin(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, formError: "입력한 내용을 확인해 주세요.", fieldErrors };
  }
  if (!hasSupabaseEnv()) return NOT_CONFIGURED;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    return { ok: false, formError: toMessage(error.code, "로그인하지 못했어요. 잠시 후 다시 시도해 주세요.") };
  }
  return { ok: true, redirectTo: homePathForRole(data.user?.user_metadata?.role) };
}

export async function submitSignup(values: SignupValues): Promise<AuthResult> {
  const input: SignupValues = {
    role: values.role === "seller" || values.role === "buyer" ? values.role : "",
    email: String(values.email ?? "").trim(),
    password: String(values.password ?? ""),
    passwordConfirm: String(values.passwordConfirm ?? ""),
  };
  const fieldErrors = validateSignup(input);
  if (Object.keys(fieldErrors).length > 0 || !input.role) {
    return { ok: false, formError: "입력한 내용을 확인해 주세요.", fieldErrors };
  }
  if (!hasSupabaseEnv()) return NOT_CONFIGURED;

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { role: input.role },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });
  if (error) {
    return { ok: false, formError: toMessage(error.code, "가입하지 못했어요. 잠시 후 다시 시도해 주세요.") };
  }

  // 이메일 인증을 켠 프로젝트는 세션 없이 사용자만 만들어진다.
  if (!data.session) {
    return {
      ok: true,
      notice: `${input.email}로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료돼요.`,
    };
  }
  return { ok: true, redirectTo: homePathForRole(input.role) };
}

export async function signOut(): Promise<void> {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
