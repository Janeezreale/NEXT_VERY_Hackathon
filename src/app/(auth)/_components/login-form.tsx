"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormAlert } from "@/src/components/common/form-alert";
import { FormField } from "@/src/components/common/form-field";
import { PasswordInput } from "@/src/components/common/password-input";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

import { submitLogin } from "../_lib/auth-handlers";
import { validateLogin, type FieldErrors, type LoginValues } from "../_lib/validation";

const FIELD_ORDER: (keyof LoginValues)[] = ["email", "password"];

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = React.useState<LoginValues>({ email: "", password: "" });
  const [errors, setErrors] = React.useState<FieldErrors<LoginValues>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const alertRef = React.useRef<HTMLDivElement>(null);

  function update<K extends keyof LoginValues>(key: K, value: LoginValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // 다시 입력하면 해당 필드의 오류를 지운다. 값은 유지한다.
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((key) => nextErrors[key]);
    if (firstInvalid) {
      document.getElementById(`login-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitLogin({ ...values, email: values.email.trim() });
      if (result.ok) {
        router.push(result.redirectTo);
        return;
      }
      setFormError(result.formError);
      if (result.fieldErrors) setErrors(result.fieldErrors);
    } catch {
      setFormError("로그인 요청을 보내지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  React.useEffect(() => {
    if (formError) alertRef.current?.focus();
  }, [formError]);

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={submitting}>
      {formError ? (
        <FormAlert ref={alertRef} tabIndex={-1} title="로그인하지 못했어요">
          {formError}
        </FormAlert>
      ) : null}

      <FormField id="login-email" label="이메일" required error={errors.email}>
        {(control) => (
          <Input
            {...control}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@example.com"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        )}
      </FormField>

      <FormField id="login-password" label="비밀번호" required error={errors.password}>
        {(control) => (
          <PasswordInput
            {...control}
            name="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => update("password", e.target.value)}
          />
        )}
      </FormField>

      <Button type="submit" fullWidth loading={submitting} loadingText="로그인 중…" className="mt-1">
        로그인하기
      </Button>

      <p className="text-center text-sm leading-5 text-muted-foreground">
        아직 계정이 없나요?{" "}
        <Link
          href="/signup"
          className="inline-flex min-h-11 items-center px-1 font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm"
        >
          회원가입
        </Link>
      </p>
    </form>
  );
}
