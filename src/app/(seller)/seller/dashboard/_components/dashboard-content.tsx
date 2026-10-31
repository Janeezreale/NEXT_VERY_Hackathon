import * as React from "react";
import { ArrowRight, Check, Clock3, Package, ShoppingBag, TriangleAlert } from "lucide-react";
import { demoProducts } from "../../products/_components/demo-products";
import { demoRequests, type DemoRequest } from "./demo-requests";
import styles from "./dashboard.module.css";

export type DemoView = "overview" | "loading" | "empty" | "error";
export type RequestFilter = "전체" | DemoRequest["statusLabel"];

type Props = {
  view: DemoView;
  filter: RequestFilter;
  onFilter: (filter: RequestFilter) => void;
  onRetry: () => void;
  onRequest: (request: DemoRequest) => void;
};

export default function DashboardContent({ view, filter, onFilter, onRetry, onRequest }: Props) {
  if (view === "loading") return (
    <section className={styles.statePanel} aria-busy="true" aria-label="대시보드 불러오는 중">
      <h2>가게 현황을 불러오는 중이에요</h2><p>로딩 화면 데모입니다.</p>
      <div className={styles.skeletons} aria-hidden="true">{[1, 2, 3].map((id) => <span key={id} />)}</div>
    </section>
  );

  if (view === "error") return (
    <section className={styles.statePanel} role="alert">
      <TriangleAlert size={36} aria-hidden="true" /><h2>가게 현황을 불러오지 못했어요</h2>
      <p>오류 화면 예시입니다. 실제 서버 오류가 아닙니다.</p>
      <button type="button" className={styles.outline} onClick={onRetry}>다시 시도 · 데모</button>
    </section>
  );

  if (view === "empty") return (
    <section className={styles.statePanel}>
      <Package size={40} aria-hidden="true" /><h2>아직 표시할 운영 현황이 없어요</h2>
      <p>상품과 예약이 없는 화면 예시입니다. 상품·재고 관리 화면을 살펴보세요.</p>
      <a className={styles.primary} href="/seller/products">상품·재고 관리 보기<ArrowRight size={18} aria-hidden="true" /></a>
      <button type="button" className={styles.outline} onClick={onRetry}>데모 현황 보기</button>
    </section>
  );

  const requests = demoRequests.filter((request) => filter === "전체" || request.statusLabel === filter);
  return (
    <>
      <section aria-labelledby="summary-title" className={styles.section}>
        <div className={styles.sectionHeading}><h2 id="summary-title">지금 확인할 현황</h2><span>데모 기준 · 10월 31일 17:00</span></div>
        <dl className={styles.metrics}>
          <div><dt><Package size={20} aria-hidden="true" />판매 중 상품</dt><dd>{demoProducts.filter((product) => product.status !== "품절").length}<small>개</small><p>데모 판매 중·마감 임박 상품</p></dd></div>
          <div className={styles.attention}><dt><Clock3 size={20} aria-hidden="true" />승인 대기</dt><dd>{demoRequests.filter((request) => request.statusLabel === "승인 대기").length}<small>건</small><p>확인이 필요한 예약 요청</p></dd></div>
          <div><dt><ShoppingBag size={20} aria-hidden="true" />픽업 대기</dt><dd>{demoRequests.filter((request) => request.statusLabel === "픽업 대기").length}<small>건</small><p>승인 후 방문 수령을 기다리는 예약</p></dd></div>
        </dl>
      </section>

      <div className={styles.columns}>
        <section className={styles.panel} aria-labelledby="requests-title">
          <div className={styles.sectionHeading}><h2 id="requests-title">확인할 예약 요청</h2><span>데모 {demoRequests.length}건</span></div>
          <div className={styles.filters} role="group" aria-label="예약 요청 데모 필터">
            {(["전체", "승인 대기", "픽업 대기"] as const).map((value) => <button type="button" key={value} aria-pressed={value === filter} onClick={() => onFilter(value)}>{value}</button>)}
          </div>
          <ul className={styles.requestList}>
            {requests.map((request) => <li key={request.id}>
              <div className={styles.requestHeader}><span className={`${styles.badge} ${request.statusLabel === "승인 대기" ? styles.warning : styles.success}`}>{request.statusLabel === "승인 대기" ? <Clock3 size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{request.statusLabel}</span><span className={styles.meta}>{request.id}</span></div>
              <h3>{request.productName}</h3><p className={styles.quantity}>{request.quantityLabel} · 예약 금액 예시 {request.priceLabel}</p><p className={styles.meta}>픽업 예시 {request.pickupLabel}</p>
              <button type="button" className={styles.outline} onClick={() => onRequest(request)} aria-label={`${request.id} 예약 상세 데모 보기`}>요청 살펴보기<ArrowRight size={16} aria-hidden="true" /></button>
            </li>)}
          </ul>
          <p className={styles.meta}>예약 승인·거절·판매 완료는 이 화면에서 처리하지 않습니다.</p>
        </section>

        <section className={styles.panel} aria-labelledby="stock-title">
          <div className={styles.sectionHeading}><h2 id="stock-title">상품별 남은 재고</h2><span>데모</span></div>
          <p className={styles.meta}>상품의 단위를 유지해 확인하세요.</p>
          <ul className={styles.stockList}>{demoProducts.map((product) => <li key={product.id}><div><h3>{product.name}</h3><span className={styles.meta}>{product.status} · 고정 시안</span></div><strong>{product.quantityLabel}<small>{product.unitLabel}</small></strong></li>)}</ul>
          <a className={styles.outline} href="/seller/products">상품·재고 관리<ArrowRight size={18} aria-hidden="true" /></a>
        </section>
      </div>
    </>
  );
}
