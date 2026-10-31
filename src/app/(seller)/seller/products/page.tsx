import { Package, TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { LiveRefresh } from "@/src/components/common/live-refresh";
import { money } from "@/src/components/customer/product-view";
import { getSaleDeadline, isSaleOpen } from "@/src/lib/pricing/price";
import { loadRecentApprovedQuantities } from "@/src/lib/server/pricing";
import { listSellerProducts, loadReservedQuantities, sellerCurrentPrice } from "@/src/lib/server/product";
import { loadSellerStore } from "@/src/lib/server/store";
import { createClient } from "@/src/lib/supabase/server";
import { FRESHNESS_LABELS, type SellerProduct } from "@/src/types/api";

import { SellerNav } from "../_components/seller-nav";
import styles from "./_components/products.module.css";

const LIST_LIMIT = 50;
const dateTime = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Seoul" });

async function loadProducts(storeId: string) {
  try {
    const supabase = await createClient();
    const { items } = await listSellerProducts(supabase, storeId, { limit: LIST_LIMIT });
    const ids = items.map((item) => item.id);
    const [recent, reserved] = await Promise.all([loadRecentApprovedQuantities(supabase, ids), loadReservedQuantities(supabase, ids)]);
    return { items, recent, reserved };
  } catch (error) {
    console.error("Failed to load seller products", error);
    return null;
  }
}

export default async function SellerProductsPage() {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  const loaded = await loadProducts(store.id);
  const products = loaded?.items ?? null;
  const now = new Date();

  function status(product: SellerProduct) {
    if (product.availableQuantity === 0) return "품절";
    return isSaleOpen(getSaleDeadline(new Date(product.saleEndsAt), store!.closingTime, now), now) ? "판매 중" : "판매 종료";
  }

  return (
    <main className={styles.page}>
      <LiveRefresh />
      <div className={styles.container}>
        <SellerNav current="/seller/products" />
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{store.name} · 상품 관리</p>
            <h1>내 상품과 재고</h1>
            <p className={styles.subtle}>남은 수량과 현재가를 확인하세요. 현재가는 30초마다 새로 계산돼요.</p>
          </div>
          <a className={styles.primary} href="/seller/publish">상품 게시</a>
        </header>

        {products === null ? (
          <section className={styles.empty} role="alert">
            <TriangleAlert size={36} aria-hidden="true" />
            <h2>상품을 불러오지 못했어요</h2>
            <p>잠시 후 다시 시도해 주세요.</p>
          </section>
        ) : products.length === 0 ? (
          <section className={styles.empty}>
            <Package size={40} aria-hidden="true" />
            <h2>아직 등록된 상품이 없어요</h2>
            <a className={styles.primary} href="/seller/publish">상품 게시</a>
          </section>
        ) : (
          <section aria-label="등록된 상품">
            <div className={styles.listHeading}><h2>상품 목록</h2><span>{products.length}개</span></div>
            <div className={styles.grid}>
              {products.map((product) => {
                const label = status(product);
                const { currentPrice, discountRate } = sellerCurrentPrice(product, store.closingTime, loaded?.recent.get(product.id) ?? 0, now);
                return (
                  <article className={styles.card} key={product.id}>
                    <div className={styles.cardBody}>
                      <span className={`${styles.badge} ${label === "판매 중" ? styles.success : styles.neutral}`}>{label}</span>
                      <h3>{product.name}</h3>
                      <dl className={styles.details}>
                        <div><dt>현재가</dt><dd>{money(currentPrice)} ({discountRate}% 할인)</dd></div>
                        <div><dt>판매 가능 재고</dt><dd>{product.availableQuantity}{product.unit}</dd></div>
                        <div><dt>예약된 수량</dt><dd>{loaded?.reserved.get(product.id) ?? 0}{product.unit}</dd></div>
                        <div><dt>기준가</dt><dd>{money(product.basePrice)}</dd></div>
                        <div><dt>최저가</dt><dd>{money(product.minPrice)}</dd></div>
                        <div><dt>신선도</dt><dd>{FRESHNESS_LABELS[product.freshness]}</dd></div>
                        <div><dt>판매 종료</dt><dd>{dateTime.format(new Date(product.saleEndsAt))}</dd></div>
                      </dl>
                      <a className={styles.outline} href={`/seller/products/${product.id}`}>상품 수정</a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
