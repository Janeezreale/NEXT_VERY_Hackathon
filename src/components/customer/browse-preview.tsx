"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Leaf, LocateFixed, MapPin, ShoppingBasket } from "lucide-react";
import { LiveRefresh } from "@/src/components/common/live-refresh";
import { findDistrict, formatDistance, productDistance, PRODUCT_SORTS, SORT_LABELS, sortProducts, type ProductSort } from "./location";
import { PreviewShell, ProductCard } from "./preview-ui";
import { EmptyFeedback, LoadFeedback } from "./preview-feedback";
import StoreMap from "./store-map";
import { browseUrl, contextQuery, filtersFrom, regionCookie, regions } from "./preview-state";
import type { ProductView } from "./product-view";
import { useLocation } from "./use-location";
import styles from "../../app/(customer)/shop/shop.module.css";

type Filters = ReturnType<typeof filtersFrom>;

const LOCATION_LABELS = { off: "내 위치 사용", locating: "위치 확인 중…", on: "내 위치 끄기", denied: "위치 다시 시도", unavailable: "위치 다시 시도" };
const LOCATION_ERRORS: Record<string, string> = {
  denied: "위치 권한이 꺼져 있어요. 브라우저 설정에서 허용해 주세요.",
  unavailable: "위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

export default function BrowsePreview({ filters, products, state = "ready", initialView = "list" }: { filters: Filters; products: ProductView[]; state?: "ready" | "error"; initialView?: "list" | "map" }) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  /** 정렬은 받은 목록 안에서 바꾸므로 서버를 다시 부르지 않는다. */
  const [sort, setSort] = useState(filters.sort);
  const location = useLocation(filters.sort === "distance");
  /** 사용자가 위치를 켰을 때 한 번만 지역을 맞춘다. 이후 직접 고른 지역을 덮어쓰지 않는다. */
  const followRegion = useRef(false);
  const [outsideSeoul, setOutsideSeoul] = useState(false);
  const startLocation = () => {
    followRegion.current = true;
    location.start();
  };
  const change = (patch: Partial<Filters>) => {
    const next = { ...filters, sort, ...patch };
    document.cookie = regionCookie(next.region);
    router.push(browseUrl(next), { scroll: false });
  };
  const changeSort = (value: ProductSort) => {
    setSort(value);
    window.history.replaceState(null, "", browseUrl({ ...filters, sort: value }));
    if (value === "distance" && location.status !== "on") startLocation();
  };
  useEffect(() => {
    if (!followRegion.current || !location.position) return;
    followRegion.current = false;
    void findDistrict(location.position).then((region) => {
      setOutsideSeoul(!region);
      if (!region || region === filters.region) return;
      document.cookie = regionCookie(region);
      router.push(browseUrl({ ...filters, sort, region }), { scroll: false });
    });
  }, [location.position, filters, sort, router]);
  const context = contextQuery({ ...filters, sort });
  const distanceLabel = (product: ProductView) => {
    const distance = productDistance(product, location.position);
    return distance === null ? undefined : formatDistance(distance);
  };
  return <PreviewShell>
    <LiveRefresh />
    <header className={styles.heading}><div><p className={styles.eyebrow}><Leaf size={16} aria-hidden="true" />우리 동네의 신선한 발견</p><h1>가까운 동네에서,<br />가볍게 만나는 신선함</h1><p className={styles.description}>필요한 만큼 골라 담고, 매장에서 직접 픽업하세요.</p></div><div className={styles.headingIcon} aria-hidden="true"><ShoppingBasket size={64} strokeWidth={1.3} /></div></header>
    <div className={`${styles.chips} mb-4`} role="group" aria-label="보기 방식">{([["list", "상품 목록"], ["map", "매장 지도"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>
    <div className={`${styles.chips} mb-4`}>
      <button type="button" aria-pressed={location.status === "on"} onClick={location.status === "on" ? location.stop : startLocation}><LocateFixed size={16} aria-hidden="true" className="mr-1 inline" />{LOCATION_LABELS[location.status]}</button>
    </div>
    {LOCATION_ERRORS[location.status] && <p className={`${styles.error} mb-4`} role="alert">{LOCATION_ERRORS[location.status]}</p>}
    {outsideSeoul && location.status === "on" && <p className={`${styles.description} mb-4`} role="status">서울 밖에서는 지역을 직접 골라 주세요.</p>}
    {view === "map" ? <StoreMap position={location.position} /> : <>
    <section className={styles.filters} aria-label="상품 탐색 조건">
      <label className={styles.region}><span><MapPin size={18} aria-hidden="true" />둘러볼 지역</span><select value={filters.region} onChange={event => change({ region: event.target.value })}><option value="">지역을 선택해 주세요</option>{regions.map(region => <option key={region}>{region}</option>)}</select></label>
    </section>
    <div className={styles.resultsHeading}><div><h2>{filters.region ? `${filters.region}의 상품` : "우리 동네 상품"}</h2>{filters.region && state === "ready" && <p role="status">상품 {products.length}개</p>}</div><label className={styles.sort}><span>정렬</span><select value={sort} onChange={event => changeSort(event.target.value as ProductSort)}>{PRODUCT_SORTS.map(value => <option key={value} value={value}>{SORT_LABELS[value]}</option>)}</select></label></div>
    {!filters.region ? <EmptyFeedback title="둘러볼 지역을 선택해 주세요" description="지역을 선택하면 해당 동네의 상품을 볼 수 있어요." /> : state !== "ready" ? <LoadFeedback state={state} subject="상품을" onRetry={() => router.refresh()} /> : products.length === 0 ? <EmptyFeedback title="이 지역에 등록된 상품이 없어요" description="다른 지역을 선택해 보세요." /> : <section className={styles.browseList} aria-label="상품 목록">{sortProducts(products, sort, location.position).map(product => <ProductCard key={product.id} product={product} distance={distanceLabel(product)} href={`/shop/products/${product.id}${context ? `?${context}` : ""}`} />)}</section>}
    </>}
  </PreviewShell>;
}