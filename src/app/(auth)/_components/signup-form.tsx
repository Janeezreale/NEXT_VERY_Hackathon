"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, ShoppingBasket, Store } from "lucide-react";

import { FormAlert } from "@/src/components/common/form-alert";
import { FormField } from "@/src/components/common/form-field";
import { PasswordInput } from "@/src/components/common/password-input";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

import { submitSignup } from "../_lib/auth-handlers";
import {
  PASSWORD_MIN_LENGTH,
  validateSignup,
  type FieldErrors,
  type SignupValues,
  type UserRole,
} from "../_lib/validation";

const FIELD_ORDER: (keyof SignupValues)[] = ["role", "email", "password", "passwordConfirm"];

const ROLE_OPTIONS: {
  value: UserRole;
  title: string;
  description: string;
  Icon: typeof Store;
}[] = [
  {
    value: "consumer",
    title: "소비자",
    description: "할인 상품을 찾고 예약해요.",
    Icon: ShoppingBasket,
  },
  {
    value: "seller",
    title: "판매자",
    description: "남은 상품을 올리고 관리해요.",
    Icon: Store,
  },
];

export function SignupForm() {
  const router = useRouter();
  const [values, setValues] = React.useState<SignupValues>({
    role: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = React.useState<FieldErrors<SignupValues>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const alertRef = React.useRef<HTMLDivElement>(null);

  function update<K extends keyof SignupValues>(key: K, value: SignupValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function focusField(key: keyof SignupValues) {
    if (key === "role") {
      const checked = document.querySelector<HTMLInputElement>('input[name="role"]:checked');
      (checked ?? document.querySelector<HTMLInputElement>('input[name="role"]'))?.focus();
      return;
    }
    document.getElementById(`signup-${key}`)?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const nextErrors = validateSignup(values);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((key) => nextErrors[key]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitSignup({ ...values, email: values.email.trim() });
      if (result.ok) {
        if ("redirectTo" in result) {
          router.replace(result.redirectTo);
          router.refresh();
        } else {
          setNotice(result.notice);
        }
        return;
      }
      setFormError(result.formError);
      if (result.fieldErrors) setErrors(result.fieldErrors);
    } catch {
      setFormError("가입 요청을 보내지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  React.useEffect(() => {
    if (formError) alertRef.current?.focus();
  }, [formError]);

  const roleErrorId = errors.role ? "signup-role-error" : undefined;

  if (notice) {
    return (
      <div className="flex flex-col gap-5">
        <FormAlert tone="info" title="인증 메일을 확인해 주세요">
          {notice}
        </FormAlert>
        <p className="text-sm leading-5 text-muted-foreground">
          메일이 보이지 않으면 스팸함을 확인해 주세요. 인증을 마친 뒤 로그인할 수 있어요.
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 text-sm leading-5 font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          로그인 화면으로
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={submitting}>
      {formError ? (
        <FormAlert ref={alertRef} tabIndex={-1} title="가입하지 못했어요">
          {formError}
        </FormAlert>
      ) : null}

      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={roleErrorId}
      >
        <legend className="mb-2 text-sm leading-5 font-semibold text-foreground">
          가입 유형
          <span className="ml-1 text-xs leading-[18px] font-medium text-muted-foreground">(필수)</span>
        </legend>
        <div className="grid gap-3">
          {ROLE_OPTIONS.map(({ value, title, description, Icon }) => {
            const selected = values.role === value;
            return (
              <label
                key={value}
                className={cn(
                  "relative flex min-h-11 cursor-pointer gap-3 rounded-lg border bg-card p-4 transition-colors duration-150",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                  selected
                    ? "border-2 border-primary bg-secondary"
                    : errors.role
                      ? "border-2 border-destructive"
                      : "border-input hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={selected}
                  onChange={() => update("role", value)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-md",
                    selected ? "bg-card text-secondary-foreground" : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col gap-1 pr-6">
                  <span className="text-base leading-6 font-semibold text-foreground">{title}</span>
                  <span className="text-sm leading-5 text-muted-foreground">{description}</span>
                </span>
                {selected ? (
                  <span
                    className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    aria-hidden="true"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
        {errors.role ? (
          <p id={roleErrorId} className="flex items-start gap-1.5 text-sm leading-5 text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{errors.role}</span>
          </p>
        ) : null}
      </fieldset>

      <FormField id="signup-email" label="이메일" required error={errors.email}>
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

      <FormField
        id="signup-password"
        label="비밀번호"
        required
        hint={`${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`}
        error={errors.password}
      >
        {(control) => (
          <PasswordInput
            {...control}
            name="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => update("password", e.target.value)}
          />
        )}
      </FormField>

      <FormField
        id="signup-passwordConfirm"
        label="비밀번호 확인"
        required
        error={errors.passwordConfirm}
      >
        {(control) => (
          <PasswordInput
            {...control}
            name="passwordConfirm"
            autoComplete="new-password"
            value={values.passwordConfirm}
            onChange={(e) => update("passwordConfirm", e.target.value)}
          />
        )}
      </FormField>

      <Button type="submit" fullWidth loading={submitting} loadingText="가입 요청 중…" className="mt-1">
        회원가입하기
      </Button>

      <p className="text-center text-sm leading-5 text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-sm px-1 font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}
