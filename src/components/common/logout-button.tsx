"use client";

import * as React from "react";

import { signOut } from "@/src/app/(auth)/_lib/auth-handlers";
import { Button } from "@/src/components/ui/button";

/** 로그아웃 버튼. 판매자·소비자 헤더에서 재사용한다. */
export function LogoutButton({ className }: { className?: string }) {
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
      로그아웃
    </Button>
  );
}
