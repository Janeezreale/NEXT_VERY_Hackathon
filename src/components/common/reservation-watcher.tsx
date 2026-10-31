"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { apiFetch } from "@/src/lib/client/api";
import type { Page, Reservation } from "@/src/types/api";

import { useSessionUser } from "./logout-button";
import { useNotify } from "./notifications";
import { reservationChanges, snapshotReservations, type ReservationSnapshot } from "./reservation-changes";

const POLL_MS = 30_000;
const LIST_LIMIT = 50;

function readSnapshot(key: string): ReservationSnapshot | null {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as ReservationSnapshot) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(key: string, snapshot: ReservationSnapshot) {
  try {
    sessionStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // 저장하지 못하면 다음 이동 때 기준이 새로 잡힐 뿐이다.
  }
}

/** 상대방이 바꾼 예약을 알린다. 판매자 메뉴는 페이지를 새로 여므로 기준을 탭 저장소에 둔다. */
export function ReservationWatcher() {
  const pathname = usePathname();
  const router = useRouter();
  const me = useSessionUser(pathname);
  const notify = useNotify();
  const id = me?.id;
  const role = me?.role;
  const hasStore = me?.hasStore;

  React.useEffect(() => {
    if (!id || !role || (role === "seller" && !hasStore)) return;
    const path = role === "seller" ? "/api/seller/reservations" : "/api/me/reservations";
    const key = `seen-reservations:${id}`;
    let active = true;

    const check = () => {
      if (document.visibilityState !== "visible") return;
      apiFetch<Page<Reservation>>(`${path}?limit=${LIST_LIMIT}`)
        .then(({ items }) => {
          if (!active) return;
          const previous = readSnapshot(key);
          const changes = previous ? reservationChanges(previous, items, role) : [];
          for (const change of changes) notify[change.kind](change.message);
          // 알림과 화면의 예약 상태가 어긋나지 않게 한다.
          if (changes.length > 0) router.refresh();
          saveSnapshot(key, snapshotReservations(items));
        })
        // 뒤에서 도는 확인이다. 실패해도 다음 주기에 다시 받고, 화면의 조회 오류는 각 화면이 보여준다.
        .catch(() => {});
    };

    check();
    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [id, role, hasStore, notify, router]);

  return null;
}
