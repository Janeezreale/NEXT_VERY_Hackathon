"use client";

import Link from "next/link";
import * as React from "react";

import { signOut } from "@/src/app/(auth)/_lib/auth-handlers";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { apiFetch, ApiClientError } from "@/src/lib/client/api";
import { cn } from "@/src/lib/utils";
import type { Me, UserRole } from "@/src/types/api";

const ROLE_LABELS: Record<UserRole, string> = { seller: "판매자 계정", consumer: "소비자 계정" };

/** 로그아웃 버튼. 판매자·소비자 헤더에서 재사용한다. */
export function LogoutButton({ className, label = "로그아웃" }: { className?: string; label?: string }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      variant="outline"
      size="compact"
      className={className}
      loading={pending}
      loadingText="로그아웃 중…"
      onClick={() => startTransition(() => signOut())}
    >
      {label}
    </Button>
  );
}

/** 지금 어떤 계정으로 쓰고 있는지 보여준다. 세션은 브라우저에 하나라 두 계정을 번갈아 쓰면 헷갈리기 쉽다. */
export function RoleLabel({ role }: { role: UserRole }) {
  return <span className="text-sm leading-5 text-muted-foreground">{ROLE_LABELS[role]}</span>;
}

/**
 * 현재 세션의 사용자. 확인 전에는 undefined, 로그인하지 않았으면 null이다.
 * 다른 탭에서 계정을 바꾸면 이 탭의 화면은 그대로이므로 화면으로 돌아올 때 다시 확인한다.
 * 페이지가 유지되는 영역은 recheckKey가 바뀔 때도 다시 확인한다.
 */
export function useSessionUser(recheckKey?: string) {
  const [me, setMe] = React.useState<Me | null>();

  React.useEffect(() => {
    let active = true;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      apiFetch<Me>("/api/me")
        .then((me) => {
          if (active) setMe(me);
        })
        .catch((error: unknown) => {
          if (active && error instanceof ApiClientError && error.code === "UNAUTHENTICATED") setMe(null);
        });
    };
    check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      active = false;
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [recheckKey]);

  return me;
}

/** 역할만 필요한 화면용. 확인 전에는 null, 로그인하지 않았으면 anonymous다. */
export function useSessionRole(): UserRole | "anonymous" | null {
  const me = useSessionUser();
  if (me === undefined) return null;
  return me?.role ?? "anonymous";
}

/** 비로그인도 보는 화면용. 세션을 확인한 뒤 계정 표시와 로그아웃 버튼이나 로그인 링크를 보여준다. */
export function SessionAuthAction({ className }: { className?: string }) {
  const role = useSessionRole();

  if (role === null) return null;
  if (role === "anonymous") {
    return (
      <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "compact" }), className)}>
        로그인
      </Link>
    );
  }
  return (
    <span className="inline-flex items-center gap-3">
      <RoleLabel role={role} />
      <LogoutButton className={className} />
    </span>
  );
}
