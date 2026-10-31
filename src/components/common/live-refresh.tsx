"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

const REFRESH_MS = 30_000;

/** 시간과 예약에 따라 바뀌는 현재가를 서버에서 다시 받는다. 화면이 보일 때만 요청한다. */
export function LiveRefresh() {
  const router = useRouter();

  React.useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return null;
}
