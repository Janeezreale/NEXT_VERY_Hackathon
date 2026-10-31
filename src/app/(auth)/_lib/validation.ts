/**
 * 인증 폼의 클라이언트 입력 확인. 서버(Supabase Auth)가 최종 검증한다.
 *
 * 비밀번호 최소 길이는 아직 확정되지 않은 정책이다(DECISIONS D01).
 * 총괄이 Supabase Auth 설정과 함께 확정하면 이 값만 바꾼다.
 */
import type { UserRole } from "@/src/types/api";

export const PASSWORD_MIN_LENGTH = 8;

export type { UserRole };

export type LoginValues = { email: string; password: string };
export type SignupValues = {
  role: UserRole | "";
  email: string;
  password: string;
  passwordConfirm: string;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "이메일을 입력해 주세요.";
  if (!EMAIL_PATTERN.test(value)) return "이메일 형식을 확인해 주세요. 예: name@example.com";
  return undefined;
}

export function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  const errors: FieldErrors<LoginValues> = {};
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  if (!values.password) errors.password = "비밀번호를 입력해 주세요.";
  return errors;
}

export function validateSignup(values: SignupValues): FieldErrors<SignupValues> {
  const errors: FieldErrors<SignupValues> = {};
  if (!values.role) errors.role = "가입 유형을 선택해 주세요.";
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  if (!values.password) {
    errors.password = "비밀번호를 입력해 주세요.";
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`;
  }
  if (!values.passwordConfirm) {
    errors.passwordConfirm = "비밀번호를 한 번 더 입력해 주세요.";
  } else if (values.password && values.password !== values.passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 서로 달라요. 다시 확인해 주세요.";
  }
  return errors;
}

/** 역할별 첫 화면. 화면 경로가 바뀌면 여기만 수정한다. 권한 판단에는 쓰지 않는다. */
export function homePathForRole(role: unknown): string {
  return role === "seller" ? "/seller/dashboard" : "/shop";
}
