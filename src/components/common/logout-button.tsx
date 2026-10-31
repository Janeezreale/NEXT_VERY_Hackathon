"use client";

import Link from "next/link";
import * as React from "react";

import { signOut } from "@/src/app/(auth)/_lib/auth-handlers";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { createClient } from "@/src/lib/supabase/client";
import { cn } from "@/src/lib/utils";

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

/** 비로그인도 보는 화면용. 세션을 확인한 뒤 로그아웃 버튼이나 로그인 링크를 표시한다. */
export function SessionAuthAction({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    void createClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(data.session !== null));
  }, []);

  if (signedIn === null) return null;
  if (signedIn) return <LogoutButton className={className} />;
  return (
    <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "compact" }), className)}>
      로그인
    </Link>
  );
}
