import { redirect } from "next/navigation";
import { connection } from "next/server";

import ReservationsPreview from "../../../../components/customer/reservations-preview";
import { toReservationView, type ReservationView } from "../../../../components/customer/reservation-view";
import { ApiError } from "../../../../lib/server/api";
import { requireUser } from "../../../../lib/server/auth";
import { listReservations } from "../../../../lib/server/reservation";

const LIST_LIMIT = 50;

async function loadReservations(): Promise<ReservationView[] | null> {
  try {
    const { supabase, id } = await requireUser();
    const { items } = await listReservations(supabase, { consumerId: id }, { limit: LIST_LIMIT });
    return items.map(toReservationView);
  } catch (error) {
    if (error instanceof ApiError && error.code === "UNAUTHENTICATED") redirect("/login");
    console.error("Failed to load reservations", error);
    return null;
  }
}

export default async function ReservationsPage() {
  // 로그인 사용자별 화면이다. 오류 처리가 정적 생성 신호를 삼키지 않도록 먼저 동적 렌더링을 지정한다.
  await connection();
  const reservations = await loadReservations();
  return <ReservationsPreview reservations={reservations ?? []} state={reservations ? "ready" : "error"} />;
}
