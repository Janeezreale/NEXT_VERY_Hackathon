import * as React from "react";
import { demoProducts } from "../../products/_components/demo-products";
import { demoDailySales, demoReportSnapshots, formatWon, type DemoPeriod } from "./demo-report";
import SalesChart from "./sales-chart";
import styles from "./reports.module.css";

export type ReportView = "report" | "loading" | "empty" | "error";

export default function ReportContent({ period, view, onRetry }: { period: DemoPeriod; view: ReportView; onRetry: () => void }) {
  if (view === "loading") return <section className={styles.empty} aria-busy="true"><h2>판매 현황을 불러오는 중이에요</h2><div className={styles.skeleton} aria-hidden="true" /></section>;
  if (view === "error") return <section className={styles.empty} role="alert"><h2>리포트를 불러오지 못했어요</h2><p>오류 화면 예시입니다. 매출 0원이나 성공 데이터로 대체하지 않습니다.</p><button className={styles.outline} onClick={onRetry}>다시 시도 · 데모</button></section>;
  if (view === "empty") return <section className={styles.empty}><h2>선택한 기간의 판매 데이터가 없어요</h2><p>데이터 없음 화면 예시입니다.</p><button className={styles.outline} onClick={onRetry}>데모 리포트 보기</button></section>;
  const snapshot = demoReportSnapshots[period];
  const rows = period === "day" ? demoDailySales.slice(-1) : demoDailySales;
  const revenue = rows.reduce((total, row) => total + row.revenue, 0);
  const completed = rows.reduce((total, row) => total + row.completed, 0);
  return <>
    <section className={styles.section} aria-labelledby="report-summary-title"><div className={styles.sectionHeading}><h2 id="report-summary-title">기간별 판매 현황 · 데모</h2><span>{snapshot.periodLabel}</span></div><dl className={styles.metrics}>
      <div className={styles.featured}><dt>판매 매출 예시</dt><dd>{formatWon(revenue)}<p>판매 완료 기준의 고정 시안</p></dd></div>
      <div><dt>판매 완료</dt><dd>{completed}건<p>기간 내 완료 건수 예시</p></dd></div>
      <div><dt>상품 등록</dt><dd>{snapshot.registered}건<p>기간 내 등록 건수 예시</p></dd></div>
      <div><dt>예약 요청</dt><dd>{snapshot.requested}건<p>기간 내 요청 건수 예시</p></dd></div>
      <div><dt>현재 승인</dt><dd>{snapshot.approved}건<p>기준 시점 승인 상태 예시 · 누적 아님</p></dd></div>
    </dl><p className={styles.note}>모든 지표는 데모 집계 정의입니다. 매출은 순이익·정산액이 아니며, 실제 집계 기준은 총괄 승인 후 연결합니다.</p></section>
    <section className={styles.panel} aria-labelledby="sales-chart-title"><div className={styles.sectionHeading}><h2 id="sales-chart-title">일별 판매 매출</h2><span><span className={styles.legend} aria-hidden="true" />판매 매출 예시 · 원</span></div><p className={styles.subtle}>차트와 같은 값을 아래 표에서 확인할 수 있어요.</p><SalesChart rows={rows} /><div className={styles.tableScroll} role="region" aria-label="일별 판매 데이터 표" tabIndex={0}><table><caption>선택 기간의 데모 일별 판매 매출·완료 건수</caption><thead><tr><th scope="col">날짜</th><th scope="col">판매 완료 (건)</th><th scope="col">판매 매출 (원)</th></tr></thead><tbody>{rows.map((row) => <tr key={row.date}><th scope="row">{row.date}</th><td>{row.completed}</td><td>{formatWon(row.revenue)}</td></tr>)}</tbody><tfoot><tr><th scope="row">데모 합계</th><td>{completed}</td><td>{formatWon(revenue)}</td></tr></tfoot></table></div></section>
    <section className={styles.panel} aria-labelledby="quantity-title"><h2 id="quantity-title">상품별 판매 수량과 잔여 재고</h2><p className={styles.subtle}>단위가 다른 수량은 합산하지 않습니다. 잔여 재고는 기간 선택과 무관한 고정 시안이며 확정 폐기량이 아닙니다.</p><ul className={styles.products}>{demoProducts.map((product, index) => <li key={product.id}><h3>{product.name}</h3><dl><div><dt>기간 내 판매 수량 예시</dt><dd>{snapshot.soldQuantityLabels[index]}</dd></div><div><dt>남은 재고 예시</dt><dd>{product.quantityLabel}{product.unitLabel}</dd></div></dl></li>)}</ul></section>
  </>;
}
