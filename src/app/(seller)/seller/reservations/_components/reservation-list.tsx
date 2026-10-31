import * as React from "react";
import { Check, Clock3, Package, X } from "lucide-react";
import { reservationStatuses, type DemoReservation, type DemoReservationAction, type DemoReservationStatus } from "./demo-reservations";
import styles from "./reservations.module.css";

export type ReservationView = "list" | "loading" | "empty" | "error";
export type ReservationFilter = "전체" | DemoReservationStatus;
type Props = {
  items: readonly DemoReservation[];
  filter: ReservationFilter;
  view: ReservationView;
  onFilter: (filter: ReservationFilter) => void;
  onRetry: () => void;
  onDetail: (item: DemoReservation) => void;
  onAction: (item: DemoReservation, action: DemoReservationAction) => void;
};

export default function ReservationList({ items, filter, view, onFilter, onRetry, onDetail, onAction }: Props) {
  if (view === "loading") return <section className={styles.empty} aria-busy="true"><h2>예약을 불러오는 중이에요</h2><p>로딩 화면 데모</p><div className={styles.skeleton} aria-hidden="true" /></section>;
  if (view === "error") return <section className={styles.empty} role="alert"><X size={36} aria-hidden="true" /><h2>예약을 불러오지 못했어요</h2><p>오류 화면 예시입니다. 실제 서버 오류가 아닙니다.</p><button className={styles.outline} onClick={onRetry}>다시 시도 · 데모</button></section>;
  if (view === "empty") return <section className={styles.empty}><Package size={36} aria-hidden="true" /><h2>아직 예약 요청이 없어요</h2><p>예약이 없는 화면 예시입니다.</p><button className={styles.outline} onClick={onRetry}>데모 예약 보기</button></section>;
  const visible = items.filter((item) => filter === "전체" || item.statusLabel === filter);
  return <>
    <section className={styles.summary} aria-label="데모 예약 현황">
      <div><span>승인 대기</span><strong>{items.filter((item) => item.statusLabel === "승인 대기").length}건</strong></div>
      <div><span>승인 후 픽업 대기</span><strong>{items.filter((item) => item.statusLabel === "예약 승인").length}건</strong></div>
      <div><span>판매 완료</span><strong>{items.filter((item) => item.statusLabel === "판매 완료").length}건</strong></div>
    </section>
    <div className={styles.filters} role="group" aria-label="예약 상태 필터">{(["전체", ...reservationStatuses] as const).map((status) => <button key={status} aria-pressed={filter === status} onClick={() => onFilter(status)}>{status}</button>)}</div>
    <section aria-labelledby="reservation-list-title">
      <div className={styles.sectionHeading}><h2 id="reservation-list-title">예약 목록</h2><span>데모 {visible.length}건</span></div>
      {visible.length === 0 ? <div className={styles.empty}><h3>이 상태의 예약이 없어요</h3><button className={styles.outline} onClick={() => onFilter("전체")}>전체 예약 보기</button></div> : <ul className={styles.grid}>{visible.map((item) => <li className={styles.card} key={item.id}>
        <div className={styles.sectionHeading}><span className={`${styles.badge} ${item.statusLabel === "승인 대기" ? styles.warning : item.statusLabel === "예약 거절" ? styles.danger : item.statusLabel === "예약 취소" ? styles.neutral : styles.success}`}>{item.statusLabel === "승인 대기" ? <Clock3 size={14} aria-hidden="true" /> : item.statusLabel === "예약 거절" || item.statusLabel === "예약 취소" ? <X size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{item.statusLabel}</span><span>{item.id}</span></div>
        <h3>{item.productName}</h3><p className={styles.quantity}>{item.quantityLabel} · 예약 금액 예시 <strong>{item.priceLabel}</strong></p><p className={styles.subtle}>픽업 예시 {item.pickupLabel}</p>
        <button className={styles.detailButton} onClick={() => onDetail(item)}>예약 상세 보기</button>
        {item.statusLabel === "승인 대기" && <div className={styles.actions}><button className={styles.primary} onClick={() => onAction(item, "예약 승인")}>승인 미리보기</button><button className={styles.outline} onClick={() => onAction(item, "예약 거절")}>거절 미리보기</button></div>}
        {item.statusLabel === "예약 승인" && <button className={styles.primary} onClick={() => onAction(item, "판매 완료")}>판매 완료 미리보기</button>}
      </li>)}</ul>}
    </section>
  </>;
}
