import { redirect } from "next/navigation";

import { listReservations } from "@/src/lib/server/reservation";
import { loadSellerStore } from "@/src/lib/server/store";
import { createClient } from "@/src/lib/supabase/server";

import { SellerNav } from "../_components/seller-nav";
import ReservationBoard from "./_components/reservation-board";
import styles from "./_components/reservations.module.css";
import { toSellerReservationView, type SellerReservationView } from "./_components/seller-reservation-view";

const LIST_LIMIT = 50;

async function loadReservations(storeId: string): Promise<SellerReservationView[] | null> {
  try {
    const { items } = await listReservations(await createClient(), { storeId }, { limit: LIST_LIMIT });
    const now = new Date();
    return items.map((item) => toSellerReservationView(item, now));
  } catch (error) {
    console.error("Failed to load seller reservations", error);
    return null;
  }
}

export default async function SellerReservationsPage() {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  const reservations = await loadReservations(store.id);

  return <main className={styles.page}><div className={styles.container}>
    <SellerNav current="/seller/reservations" />
    <header className={styles.header}><p className={styles.eyebrow}>{store.name} · 예약 관리</p><h1>예약 요청을 확인해요</h1><p className={styles.subtle}>승인 대기부터 픽업과 판매 완료까지 한눈에 살펴보세요.</p></header>
    <ReservationBoard reservations={reservations ?? []} state={reservations ? "ready" : "error"} />
  </div></main>;
}
