"use client";

import { useRef, useState } from "react";
import { ArrowRight, LayoutDashboard, Package, Store } from "lucide-react";
import { demoStore } from "../../products/_components/demo-store";
import DashboardContent, { type DemoView, type RequestFilter } from "./dashboard-content";
import type { DemoRequest } from "./demo-requests";
import styles from "./dashboard.module.css";

export default function DashboardDemo() {
  const [view, setView] = useState<DemoView>("overview");
  const [filter, setFilter] = useState<RequestFilter>("전체");
  const [selected, setSelected] = useState<DemoRequest | null>(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <aside className={styles.demoBanner}><strong>UI 미리보기 · 개발용 데모</strong><p>상품·예약·건수는 모두 예시입니다. 실제 API 조회나 데이터 저장은 하지 않습니다.</p></aside>
        <nav className={styles.nav} aria-label="판매자 화면"><a href="/seller/dashboard" aria-current="page"><LayoutDashboard size={18} aria-hidden="true" />대시보드</a><a href="/seller/products"><Package size={18} aria-hidden="true" />상품·재고 관리</a><a href="/seller/reservations">예약 관리</a><a href="/seller/reports">판매 리포트</a></nav>

        <header className={styles.header}>
          <div><p className={styles.eyebrow}><Store size={16} aria-hidden="true" />{demoStore.nameLabel} · 판매자</p><h1>오늘 가게 한눈에</h1><p className={styles.meta}>예약 요청과 남은 상품부터 확인해 보세요.</p></div>
          <a className={styles.primary} href="/seller/products">상품·재고 관리<ArrowRight size={18} aria-hidden="true" /></a>
        </header>

        <section className={styles.storeStrip} aria-label="가게 운영 정보 데모"><span>영업시간 <strong>{demoStore.businessHoursLabel}</strong></span><span>예약 접수 마감 예시 <strong>{demoStore.reservationDeadlineLabel}</strong></span><p>정책 초안 · {demoStore.reservationPolicyDraftLabel} · 총괄 승인 전</p></section>

        <section className={styles.previewControls} aria-label="대시보드 데모 화면 상태">
          <label htmlFor="dashboard-view">화면 상태 미리보기</label>
          <select id="dashboard-view" value={view} onChange={(event) => { setView(event.target.value as DemoView); setNotice(""); }}><option value="overview">운영 현황</option><option value="loading">로딩</option><option value="empty">빈 화면</option><option value="error">오류</option></select>
          <span>실제 통신 없이 화면만 전환합니다.</span>
        </section>
        <p className={styles.notice} role="status">{notice}</p>

        <DashboardContent view={view} filter={filter} onFilter={setFilter} onRetry={() => { setView("overview"); setFilter("전체"); setNotice("데모 현황으로 돌아왔어요. 실제 서버 재요청은 하지 않았어요."); }} onRequest={(request) => { setSelected(request); dialog.current?.showModal(); }} />

        <dialog ref={dialog} className={styles.dialog} aria-labelledby="request-title" aria-describedby="request-description" onClose={() => setSelected(null)}>
          {selected && <><p className={styles.eyebrow}>예약 상세 · 읽기 전용 데모</p><h2 id="request-title">{selected.productName}</h2><p id="request-description" className={styles.meta}>실제 예약이 아닙니다. 승인·거절·재고 변경·판매 완료 기능은 포함되지 않아요.</p><dl className={styles.requestDetails}><div><dt>요청 번호</dt><dd>{selected.id}</dd></div><div><dt>예약 상태</dt><dd>{selected.statusLabel}</dd></div><div><dt>요청 수량</dt><dd>{selected.quantityLabel}</dd></div><div><dt>예약 금액 예시</dt><dd>{selected.priceLabel}</dd></div><div><dt>픽업 예시</dt><dd>{selected.pickupLabel}</dd></div></dl><button type="button" className={styles.primary} autoFocus onClick={() => dialog.current?.close()}>닫기</button></>}
        </dialog>
      </div>
    </main>
  );
}
