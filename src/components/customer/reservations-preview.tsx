"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadFeedback } from "./preview-feedback";
import { reservationMatches, type LoadState } from "./preview-state";
import { CheckCircle2, Clock, MapPin, Ticket, XCircle } from "lucide-react";
import { money, type PreviewReservation, type PreviewStatus } from "./preview-data";
import { PreviewShell, ProductPhoto } from "./preview-ui";
import styles from "../../app/(customer)/shop/shop.module.css";

const explanations: Record<PreviewStatus, string> = {
  "승인 대기": "판매자 확인 후 예약이 확정돼요.", "예약 승인": "선택한 시간에 방문해 현장에서 결제해 주세요.", "예약 거절": "판매자가 요청을 승인하지 않았어요. ", "예약 취소": "취소된 예약이에요.", "판매 완료": "매장에서 결제와 수령을 마쳤어요.",
};

export default function ReservationsPreview({ reservations, state = "ready" }: { reservations: PreviewReservation[]; state?: LoadState }) {
  const router = useRouter();
  const [filter, setFilter] = useState("전체");
  const rows = reservations.filter(row => reservationMatches(row.status, filter));
  return <PreviewShell demo><header className={styles.sectionHeading}><p className={styles.eyebrow}><Ticket size={16} aria-hidden="true" />MY PICK UP</p><h1>예약 내역</h1><p className={styles.description}>요청부터 픽업까지, 예약 상태를 한눈에 확인하세요.</p></header>
    
    <div className={styles.chips} role="group" aria-label="예약 내역 필터">{["전체", "진행 중", "진행 완료"].map(status => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status}</button>)}</div>
    
    <section className={styles.reservationList} aria-label="예약 목록">{state !== "ready" ? <LoadFeedback state={state} subject="예약 내역을" onRetry={() => router.replace("/shop/reservations", { scroll: false })} /> : rows.length === 0 ? <div className={styles.empty}><Ticket size={36} aria-hidden="true" /><h2>{reservations.length === 0 ? "아직 예약 내역이 없어요" : "해당하는 예약이 없어요"}</h2><p>{reservations.length === 0 ? "마음에 드는 동네 상품을 둘러보세요." : "다른 필터에서 예약을 확인해 주세요."}</p>{reservations.length === 0 ? <Link className={styles.primary} href="/shop">상품 탐색하기</Link> : <button className={styles.primary} onClick={() => setFilter("전체")}>전체 예약 보기</button>}</div> : rows.map(row => <article className={styles.panel} key={row.id}>
      <div className={styles.reservationTop}><span className={styles.badge} data-status={row.status}>{row.status === "승인 대기" ? <Clock size={15} aria-hidden="true" /> : row.status === "예약 거절" || row.status === "예약 취소" ? <XCircle size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}{row.status}</span></div>
      <div className={styles.miniProduct}><ProductPhoto product={row.product} /><div><h2>{row.product.name}</h2><p className={styles.description}>{row.quantity}{row.product.unit}</p><p className={styles.reservedPrice}>확정 총액 <strong>{money(row.total)}</strong></p></div></div>
      <p className={styles.reservationPickup}><Clock size={16} aria-hidden="true" />픽업 {row.pickup}</p>
      <details className={styles.reservationDisclosure}>
        <summary><span className={styles.closedLabel}>예약 상세 보기</span><span className={styles.openLabel}>예약 상세 접기</span><span className={styles.disclosureChevron} aria-hidden="true">⌄</span></summary>
        <dl className={styles.details}><div><dt>예약 번호</dt><dd>{row.id}</dd></div><div><dt>픽업 매장</dt><dd>{row.product.store}</dd></div><div><dt>예약 당시 단가</dt><dd>{money(row.confirmedUnitPrice)}</dd></div><div><dt>픽업 주소</dt><dd>{row.product.address}</dd></div></dl>
        <p className={styles.info}>{explanations[row.status]}</p><p className={styles.store}><MapPin size={16} aria-hidden="true" />결제와 수령은 매장에서 진행해 주세요.</p>{row.status === "예약 거절" && <Link className={styles.back} href="/shop">다른 상품 둘러보기 →</Link>}
      </details>
    </article>)}</section>
  </PreviewShell>;
}
