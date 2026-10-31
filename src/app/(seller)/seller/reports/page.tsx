import { redirect } from "next/navigation";

import { money } from "@/src/components/customer/product-view";
import { loadReport } from "@/src/lib/server/report";
import { loadSellerStore } from "@/src/lib/server/store";
import { createClient } from "@/src/lib/supabase/server";
import type { Report } from "@/src/types/api";

import { SellerNav } from "../_components/seller-nav";
import SalesChart from "./_components/sales-chart";
import styles from "./_components/reports.module.css";

const PERIODS = [
  { days: 1, label: "오늘" },
  { days: 7, label: "최근 7일" },
  { days: 30, label: "최근 30일" },
];

async function load(storeId: string, days: number): Promise<Report | null> {
  try {
    return await loadReport(await createClient(), storeId, days);
  } catch (error) {
    console.error("Failed to load seller report", error);
    return null;
  }
}

export default async function SellerReportsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  const requested = Number((await searchParams).days);
  const days = PERIODS.some((period) => period.days === requested) ? requested : 7;
  const report = await load(store.id, days);

  return <main className={styles.page}><div className={styles.container}>
    <SellerNav current="/seller/reports" />
    <header className={styles.header}><p className={styles.eyebrow}>{store.name} · 판매자 리포트</p><h1>판매 흐름을 살펴봐요</h1><p className={styles.subtle}>판매 완료와 남은 상품을 구분해서 확인하세요.</p></header>
    <nav aria-label="조회 기간" className="flex flex-wrap gap-2">{PERIODS.map((period) => <a key={period.days} href={`/seller/reports?days=${period.days}`} aria-current={period.days === days ? "page" : undefined} className="inline-flex min-h-11 items-center rounded-full border border-input px-4 text-sm aria-[current=page]:border-link aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-link">{period.label}</a>)}</nav>
    {!report ? <section className={styles.empty} role="alert"><h2>리포트를 불러오지 못했어요</h2><p>잠시 후 다시 시도해 주세요.</p></section> : <>
      <section className={styles.section} aria-labelledby="report-summary-title"><div className={styles.sectionHeading}><h2 id="report-summary-title">기간별 판매 현황</h2><span>{report.from} – {report.to} · 한국 시간</span></div><dl className={styles.metrics}>
        <div className={styles.featured}><dt>판매 매출</dt><dd>{money(report.revenue)}<p>판매 완료 기준</p></dd></div>
        <div><dt>판매 완료</dt><dd>{report.completedSales}건</dd></div>
        <div><dt>상품 등록</dt><dd>{report.registeredProducts}건</dd></div>
        <div><dt>예약 요청</dt><dd>{report.requestedReservations}건</dd></div>
        <div><dt>기간 내 승인</dt><dd>{report.approvedReservations}건<p>승인 후 취소 포함</p></dd></div>
        <div><dt>현재 승인 상태</dt><dd>{report.currentApproved}건<p>픽업을 기다리는 예약</p></dd></div>
      </dl><p className={styles.note}>매출은 판매 완료 금액이며 순이익·정산액이 아닙니다.</p></section>
      <section className={styles.panel} aria-labelledby="sales-chart-title"><div className={styles.sectionHeading}><h2 id="sales-chart-title">일별 판매 매출</h2></div><p className={styles.subtle}>차트와 같은 값을 아래 표에서 확인할 수 있어요.</p><SalesChart rows={report.series} /><div className={styles.tableScroll} role="region" aria-label="일별 판매 데이터 표" tabIndex={0}><table><thead><tr><th scope="col">날짜</th><th scope="col">판매 완료 (건)</th><th scope="col">판매 매출 (원)</th></tr></thead><tbody>{report.series.map((row) => <tr key={row.date}><th scope="row">{row.date}</th><td>{row.completed}</td><td>{money(row.revenue)}</td></tr>)}</tbody></table></div></section>
      <section className={styles.panel} aria-labelledby="quantity-title"><h2 id="quantity-title">상품별 판매 수량과 잔여 재고</h2><p className={styles.subtle}>단위가 다른 수량은 합산하지 않습니다. 잔여 재고는 현재 값이며 확정 폐기량이 아닙니다.</p><ul className={styles.products}>{report.products.map((product) => <li key={product.id}><h3>{product.name}</h3><dl><div><dt>기간 내 판매 수량</dt><dd>{product.soldQuantity}{product.unit}</dd></div><div><dt>남은 재고</dt><dd>{product.remainingQuantity}{product.unit}</dd></div></dl></li>)}</ul></section>
    </>}
  </div></main>;
}
