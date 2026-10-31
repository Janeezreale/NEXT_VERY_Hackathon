"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Leaf, MapPin, ShoppingBasket, Store } from "lucide-react";
import { LiveRefresh } from "@/src/components/common/live-refresh";
import { CurrentPrice, PickupFacts, PreviewShell, ProductPhoto } from "./preview-ui";
import { EmptyFeedback, LoadFeedback } from "./preview-feedback";
import StoreMap from "./store-map";
import { browseUrl, contextQuery, filtersFrom, regionCookie, regions } from "./preview-state";
import { SALE_STATUS_LABELS, type ProductView } from "./product-view";
import styles from "../../app/(customer)/shop/shop.module.css";

type Filters = ReturnType<typeof filtersFrom>;
export default function BrowsePreview({ filters, products, state = "ready" }: { filters: Filters; products: ProductView[]; state?: "ready" | "error" }) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "map">("list");
  const change = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    document.cookie = regionCookie(next.region);
    router.push(browseUrl(next), { scroll: false });
  };
  const context = contextQuery(filters);
  return <PreviewShell>
    <LiveRefresh />
    <header className={styles.heading}><div><p className={styles.eyebrow}><Leaf size={16} aria-hidden="true" />우리 동네의 신선한 발견</p><h1>가까운 동네에서,<br />가볍게 만나는 신선함</h1><p className={styles.description}>필요한 만큼 골라 담고, 매장에서 직접 픽업하세요.</p></div><div className={styles.headingIcon} aria-hidden="true"><ShoppingBasket size={64} strokeWidth={1.3} /></div></header>
    <div className={`${styles.chips} mb-4`} role="group" aria-label="보기 방식">{([["list", "상품 목록"], ["map", "매장 지도"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>
    {view === "map" ? <StoreMap /> : <>
    <section className={styles.filters} aria-label="상품 탐색 조건">
      <label className={styles.region}><span><MapPin size={18} aria-hidden="true" />둘러볼 지역</span><select value={filters.region} onChange={event => change({ region: event.target.value })}><option value="">지역을 선택해 주세요</option>{regions.map(region => <option key={region}>{region}</option>)}</select></label>
    </section>
    <div className={styles.resultsHeading}><div><h2>{filters.region ? `${filters.region}의 상품` : "우리 동네 상품"}</h2>{filters.region && state === "ready" && <p role="status">상품 {products.length}개</p>}</div></div>
    {!filters.region ? <EmptyFeedback title="둘러볼 지역을 선택해 주세요" description="지역을 선택하면 해당 동네의 상품을 볼 수 있어요." /> : state !== "ready" ? <LoadFeedback state={state} subject="상품을" onRetry={() => router.refresh()} /> : products.length === 0 ? <EmptyFeedback title="이 지역에 등록된 상품이 없어요" description="다른 지역을 선택해 보세요." /> : <section className={styles.browseList} aria-label="상품 목록">{products.map(product => <article className={styles.card} key={product.id}><ProductPhoto product={product} /><div className={styles.cardBody}><p className={styles.store}><Store size={14} aria-hidden="true" />{product.store}</p><h3>{product.name}</h3><CurrentPrice product={product} />{product.notice ? <><span className={styles.badge} data-status="예약 취소">{SALE_STATUS_LABELS[product.saleStatus]}</span><p className={styles.notice}>{product.notice}</p></> : <PickupFacts product={product} />}<Link href={`/shop/products/${product.id}${context ? `?${context}` : ""}`} className={styles.detailButton}>상품 상세 보기<ArrowRight size={18} aria-hidden="true" /></Link></div></article>)}</section>}
    </>}
  </PreviewShell>;
}