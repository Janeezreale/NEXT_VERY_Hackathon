"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Phone } from "lucide-react";
import { LiveRefresh } from "@/src/components/common/live-refresh";
import { EmptyFeedback, LoadFeedback } from "./preview-feedback";
import { PreviewShell, ProductCard } from "./preview-ui";
import type { ProductView } from "./product-view";
import type { StoreView } from "./store-view";
import styles from "../../app/(customer)/shop/shop.module.css";

const BACK = "/shop?view=map";

/** 가게 프로필과 그 가게의 판매 상품 */
export default function StorePreview({ store, products, state }: { store: StoreView | null; products: ProductView[]; state: "ready" | "error" }) {
  const router = useRouter();
  if (!store) {
    return <PreviewShell back={BACK}>{state === "error" ? <LoadFeedback state="error" subject="가게를" onRetry={() => router.refresh()} /> : <EmptyFeedback title="가게를 찾을 수 없어요" description="지도에서 다른 가게를 선택해 주세요." />}</PreviewShell>;
  }
  return <PreviewShell back={BACK}>
    <LiveRefresh />
    <header className={styles.panel}>
      <p className={styles.eyebrow}>{store.region}</p>
      <h1 className={styles.productTitle}>{store.name}</h1>
      {store.description && <p className={styles.description}>{store.description}</p>}
      <div className={styles.storeFacts}>
        <p className={styles.address}><Clock size={18} aria-hidden="true" />{store.status} · 영업시간 {store.hours}</p>
        <p className={styles.address}><MapPin size={18} aria-hidden="true" />{store.address}</p>
        {store.phone && <p className={styles.address}><Phone size={18} aria-hidden="true" /><Link href={`tel:${store.phone}`}>{store.phoneLabel}</Link></p>}
      </div>
    </header>
    <div className={styles.resultsHeading} id="products"><div><h2>판매 상품</h2>{state === "ready" && <p role="status">상품 {products.length}개</p>}</div></div>
    {state !== "ready" ? <LoadFeedback state={state} subject="상품을" onRetry={() => router.refresh()} /> : products.length === 0 ? <EmptyFeedback title="지금 판매 중인 상품이 없어요" description="다른 가게도 둘러보세요." /> : <section className={styles.browseList} aria-label="판매 상품 목록">{products.map(product => <ProductCard key={product.id} product={product} href={`/shop/products/${product.id}`} />)}</section>}
  </PreviewShell>;
}
