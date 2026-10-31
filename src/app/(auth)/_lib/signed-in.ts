import "server-only";

import { redirect, unstable_rethrow } from "next/navigation";

import { ApiError } from "@/src/lib/server/api";
import { requireUser } from "@/src/lib/server/auth";

import { homePathForRole } from "./validation";

/** 이미 로그인했으면 역할별 첫 화면으로 보낸다. 확인에 실패해도 로그인은 할 수 있어야 하므로 화면을 막지 않는다. */
export async function redirectIfSignedIn() {
  let role: string;
  try {
    ({ role } = await requireUser());
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof ApiError)) console.error("Failed to check the session", error);
    return;
  }
  redirect(homePathForRole(role));
}
