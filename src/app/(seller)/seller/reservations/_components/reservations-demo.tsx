"use client";

import { useRef, useState } from "react";
import { demoReservations, type DemoReservation, type DemoReservationAction } from "./demo-reservations";
import ReservationList, { type ReservationFilter, type ReservationView } from "./reservation-list";
import styles from "./reservations.module.css";

export default function ReservationsDemo() {
  const [items, setItems] = useState(demoReservations);
  const [filter, setFilter] = useState<ReservationFilter>("전체");
  const [view, setView] = useState<ReservationView>("list");
  const [selected, setSelected] = useState<{ item: DemoReservation; action?: DemoReservationAction } | null>(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const noticeElement = useRef<HTMLParagraphElement>(null);
  const focusNoticeOnClose = useRef(false);

  function open(item: DemoReservation, action?: DemoReservationAction) {
    setSelected({ item, action });
    dialog.current?.showModal();
  }

  return <main className={styles.page}><div className={styles.container}>
    <aside className={styles.demoBanner}><strong>UI 미리보기 · 개발용 데모</strong><p>모든 예약은 예시입니다. 상태 변경은 이 화면에만 반영되며 실제 예약·재고·매출·리포트는 변경하지 않습니다.</p></aside>
    <nav className={styles.nav} aria-label="판매자 화면"><a href="/seller/dashboard">대시보드</a><a href="/seller/products">상품·재고</a><a href="/seller/reservations" aria-current="page">예약 관리</a><a href="/seller/reports">판매 리포트</a></nav>
    <header className={styles.header}><p className={styles.eyebrow}>판매자 · 예약 관리</p><h1>예약 요청을 확인해요</h1><p className={styles.subtle}>승인 대기부터 픽업과 판매 완료까지 한눈에 살펴보세요.</p></header>
    <section className={styles.previewControls} aria-label="예약 화면 상태 미리보기"><label htmlFor="reservation-view">화면 상태 미리보기</label><select id="reservation-view" value={view} onChange={(event) => { setView(event.target.value as ReservationView); setNotice(""); }}><option value="list">예약 목록</option><option value="loading">로딩</option><option value="empty">빈 목록</option><option value="error">오류</option></select><span>실제 API 통신은 하지 않습니다.</span></section>
    <p ref={noticeElement} className={styles.notice} role="status" tabIndex={-1}>{notice}</p>
    <ReservationList items={items} filter={filter} view={view} onFilter={setFilter} onRetry={() => { setView("list"); setNotice("데모 목록으로 돌아왔어요. 실제 재요청은 하지 않았습니다."); }} onDetail={(item) => open(item)} onAction={open} />
    <dialog className={styles.dialog} ref={dialog} aria-labelledby="reservation-detail-title" aria-describedby="reservation-detail-description" onClose={() => { setSelected(null); if (focusNoticeOnClose.current) { noticeElement.current?.focus(); focusNoticeOnClose.current = false; } }}>
      {selected && <><p className={styles.eyebrow}>실제 처리 없는 데모</p><h2 id="reservation-detail-title">{selected.action ? `${selected.action} 미리보기` : "예약 상세"}</h2><p id="reservation-detail-description" className={styles.subtle}>데모 표시만 바뀝니다. 서버 저장·재고 처리·결제·판매 기록 생성은 하지 않습니다.</p><h3 className={styles.dialogProduct}>{selected.item.productName}</h3><dl className={styles.details}><div><dt>요청 번호</dt><dd>{selected.item.id}</dd></div><div><dt>현재 데모 상태</dt><dd>{selected.item.statusLabel}</dd></div><div><dt>예약 수량</dt><dd>{selected.item.quantityLabel}</dd></div><div><dt>예약 금액 예시</dt><dd>{selected.item.priceLabel}</dd></div><div><dt>픽업 예시</dt><dd>{selected.item.pickupLabel}</dd></div></dl><p className={styles.subtle}>실제 고객 정보·거절 사유는 제공되지 않아 표시하지 않습니다. 새로고침하면 데모 변경이 초기화됩니다.</p><div className={styles.actions}><button className={styles.outline} autoFocus onClick={() => dialog.current?.close()}>{selected.action ? "취소" : "닫기"}</button>{selected.action && <button className={selected.action === "예약 거절" ? styles.destructive : styles.primary} onClick={() => {
        const action = selected.action;
        if (!action) return;
        setItems((current) => current.map((item) => item.id === selected.item.id ? { ...item, statusLabel: action } : item));
        setNotice(`${selected.item.id}의 데모 표시를 '${action}'으로 변경했어요. 실제 예약 처리나 저장은 하지 않았습니다.`);
        focusNoticeOnClose.current = true;
        dialog.current?.close();
      }}>데모 화면에서 {selected.action} 표시</button>}</div></>}
    </dialog>
  </div></main>;
}
