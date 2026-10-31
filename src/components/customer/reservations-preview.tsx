"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadFeedback } from "./preview-feedback";
import { reservationMatches } from "./preview-state";
import { CheckCircle2, Clock, MapPin, Ticket, XCircle } from "lucide-react";
import { apiFetch, ApiClientError } from "@/src/lib/client/api";
import { money } from "./product-view";
import { PreviewShell, ProductPhoto } from "./preview-ui";
import type { ReservationView } from "./reservation-view";
import styles from "../../app/(customer)/shop/shop.module.css";

const CLOSED_STATUSES = ["예약 거절", "예약 취소", "기한 만료", "미방문"];

export default function ReservationsPreview({ reservations, state = "ready" }: { reservations: ReservationView[]; state?: "ready" | "error" }) {
  const router = useRouter();
  const [filter, setFilter] = useState("전체");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const rows = reservations.filter(row => reservationMatches(row.status, filter));

  async function cancel(id: string) {
    if (cancelling || !window.confirm("이 예약을 취소할까요?")) return;
    setCancelling(id);
    setCancelError("");
    try {
      await apiFetch(`/api/reservations/${id}/cancel`, { method: "POST" });
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiClientError)) throw error;
      setCancelError(error.message);
      router.refresh();
    } finally {
      setCancelling(null);
    }
  }

  return <PreviewShell><header className={styles.sectionHeading}><p className={styles.eyebrow}><Ticket size={16} aria-hidden="true" />MY PICK UP</p><h1>예약 내역</h1><p className={styles.description}>예약부터 픽업까지, 예약 상태를 한눈에 확인하세요.</p></header>

    <div className={styles.chips} role="group" aria-label="예약 내역 필터">{["전체", "진행 중", "진행 완료"].map(status => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status}</button>)}</div>
    {cancelError && <p className={styles.error} role="alert">{cancelError}</p>}

    <section className={styles.reservationList} aria-label="예약 목록">{state !== "ready" ? <LoadFeedback state={state} subject="예약 내역을" onRetry={() => router.refresh()} /> : rows.length === 0 ? <div className={styles.empty}><Ticket size={36} aria-hidden="true" /><h2>{reservations.length === 0 ? "아직 예약 내역이 없어요" : "해당하는 예약이 없어요"}</h2><p>{reservations.length === 0 ? "마음에 드는 동네 상품을 둘러보세요." : "다른 필터에서 예약을 확인해 주세요."}</p>{reservations.length === 0 ? <Link className={styles.primary} href="/shop">상품 탐색하기</Link> : <button className={styles.primary} onClick={() => setFilter("전체")}>전체 예약 보기</button>}</div> : rows.map(row => <article className={styles.panel} key={row.id}>
      <div className={styles.reservationTop}><span className={styles.badge} data-status={row.status}>{CLOSED_STATUSES.includes(row.status) ? <XCircle size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}{row.status}</span></div>
      <div className={styles.miniProduct}><ProductPhoto product={{ name: row.name, photo: null }} /><div><h2>{row.name}</h2><p className={styles.description}>{row.quantity}{row.unit}</p><p className={styles.reservedPrice}>확정 총액 <strong>{money(row.total)}</strong></p></div></div>
      <p className={styles.reservationPickup}><Clock size={16} aria-hidden="true" />픽업 {row.pickup}</p>
      <details className={styles.reservationDisclosure}>
        <summary><span className={styles.closedLabel}>예약 상세 보기</span><span className={styles.openLabel}>예약 상세 접기</span><span className={styles.disclosureChevron} aria-hidden="true">⌄</span></summary>
        <dl className={styles.details}><div><dt>픽업 매장</dt><dd>{row.store}</dd></div><div><dt>예약 당시 단가</dt><dd>{money(row.unitPrice)}</dd></div><div><dt>픽업 주소</dt><dd>{row.address}</dd></div></dl>
        <p className={styles.info}>{row.explanation}</p><p className={styles.store}><MapPin size={16} aria-hidden="true" />결제와 수령은 매장에서 진행해 주세요.</p>{row.status === "예약 거절" && <Link className={styles.back} href="/shop">다른 상품 둘러보기 →</Link>}
        {row.canCancel && <button className={styles.detailButton} disabled={cancelling !== null} onClick={() => cancel(row.id)}>{cancelling === row.id ? "취소 중…" : "예약 취소하기"}</button>}
      </details>
    </article>)}</section>
  </PreviewShell>;
}
