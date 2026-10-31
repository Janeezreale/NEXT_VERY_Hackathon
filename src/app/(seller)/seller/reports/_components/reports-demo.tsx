"use client";

import { useState } from "react";
import { demoStore } from "../../products/_components/demo-store";
import ReportContent, { type ReportView } from "./report-content";
import type { DemoPeriod } from "./demo-report";
import styles from "./reports.module.css";

export default function ReportsDemo() {
  const [period, setPeriod] = useState<DemoPeriod>("week");
  const [view, setView] = useState<ReportView>("report");
  const [notice, setNotice] = useState("");
  return <main className={styles.page}><div className={styles.container}>
    <aside className={styles.demoBanner}><strong>UI 미리보기 · 개발용 데모</strong><p>모든 수치·금액은 고정 예시이며 실제 판매 기록이 아닙니다. API 조회나 데이터 저장은 하지 않습니다.</p></aside>
    <nav className={styles.nav} aria-label="판매자 화면"><a href="/seller/dashboard">대시보드</a><a href="/seller/products">상품·재고</a><a href="/seller/reservations">예약 관리</a><a href="/seller/reports" aria-current="page">판매 리포트</a></nav>
    <header className={styles.header}><p className={styles.eyebrow}>{demoStore.nameLabel} · 판매자 리포트</p><h1>판매 흐름을 살펴봐요</h1><p className={styles.subtle}>판매 완료와 남은 상품을 구분해서 확인하세요.</p></header>
    <section className={styles.controls} aria-label="리포트 기간 및 화면 상태"><div><label htmlFor="report-period">조회 기간 · 데모</label><select id="report-period" value={period} onChange={(event) => setPeriod(event.target.value as DemoPeriod)}><option value="day">당일 예시 · 10월 31일</option><option value="week">7일 예시 · 10월 25–31일</option></select></div><div><label htmlFor="report-view">화면 상태 미리보기</label><select id="report-view" value={view} onChange={(event) => { setView(event.target.value as ReportView); setNotice(""); }}><option value="report">판매 리포트</option><option value="loading">로딩</option><option value="empty">데이터 없음</option><option value="error">오류</option></select></div><p>데모 기준 시점: 2026.10.31 20:00 · 한국 시간 · 실제 갱신 시각이 아닙니다.</p></section>
    <p className={styles.notice} role="status">{notice}</p>
    <ReportContent period={period} view={view} onRetry={() => { setView("report"); setNotice("데모 리포트로 돌아왔어요. 실제 API 재요청은 하지 않았습니다."); }} />
  </div></main>;
}
