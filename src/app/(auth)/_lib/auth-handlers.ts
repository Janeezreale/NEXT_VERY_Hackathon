import type { LoginValues, SignupValues } from "./validation";

/**
 * 인증 UI와 인증 로직(총괄, L03)의 연결 지점.
 *
 * 회원가입·로그인·세션·역할 부여는 Supabase Auth로 총괄이 구현한다(API_CONTRACT.md).
 * 연동 전에는 가짜 성공을 돌려주지 않고, 연결되지 않았다는 사실을 그대로 알린다.
 */
export type AuthResult =
  | { ok: true; redirectTo: string; message?: string }
  | { ok: false; formError: string; fieldErrors?: Partial<Record<string, string>> };

const NOT_CONNECTED =
  "아직 로그인 서버와 연결되지 않았어요. 인증 연동(L03)이 끝나면 사용할 수 있어요.";

export async function submitLogin(values: LoginValues): Promise<AuthResult> {
  // TODO(L03): Supabase Auth signInWithPassword 연동 후 역할별 첫 화면으로 이동.
  void values;
  return { ok: false, formError: NOT_CONNECTED };
}

export async function submitSignup(values: SignupValues): Promise<AuthResult> {
  // TODO(L03): Supabase Auth signUp 연동. 역할은 서버가 부여·검증한다(D01).
  void values;
  return { ok: false, formError: NOT_CONNECTED };
}
