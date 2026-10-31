"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Package, X } from "lucide-react";

import { money } from "@/src/components/customer/product-view";
import { useNotify } from "@/src/components/common/notifications";
import { apiFetch, ApiClientError } from "@/src/lib/client/api";
import type { Reservation } from "@/src/types/api";

import { ACTION_LABELS, toSellerReservationView, type SellerAction, type SellerReservationView } from "./seller-reservation-view";
import styles from "./reservations.module.css";

const STATUSES = ["예약 확정", "판매 완료", "예약 취소", "미방문"];
/** 승인 제도가 있던 때의 이력. 해당 예약이 있을 때만 필터에 보인다. */
const PAST_STATUSES = ["예약 거절", "기한 만료"];
const CONFIRM_MESSAGES: Partial<Record<SellerAction, string>> = {
  cancel: "이 예약을 취소할까요? 재고가 돌아가요.",
  "no-show": "노쇼로 처리할까요? 재고가 돌아가요.",
  complete: "현장 결제와 수령을 마쳤나요? 판매 기록이 만들어져요.",
};

const DONE_MESSAGES: Record<SellerAction, string> = {
  complete: "판매 완료로 처리했어요.",
  cancel: "예약을 취소했어요.",
  "no-show": "노쇼로 처리했어요.",
};

function formatPhone(phone: string) {
  return phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
}

function badgeClass(status: string) {
  if (status === "예약 거절") return styles.danger;
  if (status === "예약 확정" || status === "판매 완료") return styles.success;
  return styles.neutral;
}

export default function ReservationBoard({ reservations: loaded, state }: { reservations: SellerReservationView[]; state: "ready" | "error" }) {
  const router = useRouter();
  const [filter, setFilter] = useState("전체");
  const [busy, setBusy] = useState<string | null>(null);
  const [, startRefresh] = useTransition();
  /** 처리 응답을 바로 보여주고, 전체 목록은 뒤에서 새로 받는다. */
  const [updated, setUpdated] = useState<Record<string, SellerReservationView>>({});
  const reservations = loaded.map((item) => updated[item.id] ?? item);
  const notify = useNotify();
  const count = (status: string) => reservations.filter((item) => item.status === status).length;
  const statuses = [...STATUSES, ...PAST_STATUSES.filter((status) => count(status) > 0)];
  const visible = reservations.filter((item) => filter === "전체" || item.status === filter);

  async function run(id: string, action: SellerAction) {
    const message = CONFIRM_MESSAGES[action];
    if (busy || (message && !window.confirm(message))) return;
    setBusy(id);
    try {
      const reservation = await apiFetch<Reservation>(`/api/seller/reservations/${id}/${action}`, { method: "POST" });
      setUpdated((current) => ({ ...current, [id]: toSellerReservationView(reservation, new Date()) }));
      notify.status(DONE_MESSAGES[action]);
    } catch (failure) {
      if (!(failure instanceof ApiClientError)) throw failure;
      notify.issue(failure.message);
    } finally {
      setBusy(null);
    }
    startRefresh(() => router.refresh());
  }

  if (state === "error") {
    return <section className={styles.empty} role="alert"><X size={36} aria-hidden="true" /><h2>예약을 불러오지 못했어요</h2><p>잠시 후 다시 시도해 주세요.</p><button className={styles.outline} onClick={() => router.refresh()}>다시 시도</button></section>;
  }
  if (reservations.length === 0) {
    return <section className={styles.empty}><Package size={36} aria-hidden="true" /><h2>아직 예약이 없어요</h2><p>소비자가 예약하면 여기에 나타나요.</p></section>;
  }

  return <>
    <section className={styles.summary} aria-label="예약 현황">
      <div><span>픽업 대기</span><strong>{count("예약 확정")}건</strong></div>
      <div><span>판매 완료</span><strong>{count("판매 완료")}건</strong></div>
    </section>
    <div className={styles.filters} role="group" aria-label="예약 상태 필터">{["전체", ...statuses].map((status) => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status}</button>)}</div>
    <section aria-labelledby="reservation-list-title">
      <div className={styles.sectionHeading}><h2 id="reservation-list-title">예약 목록</h2><span>{visible.length}건</span></div>
      {visible.length === 0 ? <div className={styles.empty}><h3>이 상태의 예약이 없어요</h3><button className={styles.outline} onClick={() => setFilter("전체")}>전체 예약 보기</button></div> : <ul className={styles.grid}>{visible.map((item) => <li className={styles.card} key={item.id}>
        <span className={`${styles.badge} ${badgeClass(item.status)}`}>{item.status}</span>
        <h3>{item.name}</h3>
        <p className={styles.quantity}>{item.quantity}{item.unit} · 확정 금액 <strong>{money(item.total)}</strong></p>
        <p className={styles.subtle}>픽업 {item.pickup} · 한국 시간</p>
        {item.contact && <p className={styles.quantity}>{item.contact.name} · <a href={`tel:${item.contact.phone}`}>{formatPhone(item.contact.phone)}</a></p>}
        <p className={styles.subtle}>{item.explanation}</p>
        {item.actions.length > 0 && <div className={styles.actions}>{item.actions.map((action, index) => <button key={action} className={index === 0 ? styles.primary : styles.outline} disabled={busy !== null} onClick={() => run(item.id, action)}>{busy === item.id ? "처리 중…" : ACTION_LABELS[action]}</button>)}</div>}
      </li>)}</ul>}
    </section>
  </>;
}
