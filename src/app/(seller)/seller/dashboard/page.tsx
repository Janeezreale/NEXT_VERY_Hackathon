import Link from "next/link";
import { redirect } from "next/navigation";

import { money } from "@/src/components/customer/product-view";
import { toReservationView } from "@/src/components/customer/reservation-view";
import { getSaleStatus } from "@/src/lib/pricing/price";
import { listSellerProducts } from "@/src/lib/server/product";
import { loadReport } from "@/src/lib/server/report";
import { listReservations } from "@/src/lib/server/reservation";
import { loadSellerStore } from "@/src/lib/server/store";
import { createClient } from "@/src/lib/supabase/server";

import { SellerNav } from "../_components/seller-nav";
import styles from "../reservations/_components/reservations.module.css";

const LIST_LIMIT = 50;
const PREVIEW_COUNT = 3;

async function loadDashboard(storeId: string) {
  try {
    const supabase = await createClient();
    const [products, reservations, today] = await Promise.all([
      listSellerProducts(supabase, storeId, { limit: LIST_LIMIT }),
      listReservations(supabase, { storeId }, { limit: LIST_LIMIT }),
      loadReport(supabase, storeId, 1),
    ]);
    return { products: products.items, reservations: reservations.items, today };
  } catch (error) {
    console.error("Failed to load seller dashboard", error);
    return null;
  }
}

export default async function SellerDashboardPage() {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  const data = await loadDashboard(store.id);
  const now = new Date();

  const header = <header className={styles.header}><p className={styles.eyebrow}>{store.name} · 판매자</p><h1>오늘 가게 한눈에</h1><p className={styles.subtle}>픽업할 예약과 남은 상품부터 확인해 보세요.</p></header>;
  if (!data) {
    return <main className={styles.page}><div className={styles.container}><SellerNav current="/seller/dashboard" />{header}<section className={styles.empty} role="alert"><h2>현황을 불러오지 못했어요</h2><p>잠시 후 다시 시도해 주세요.</p></section></div></main>;
  }

  const onSale = data.products.filter((product) => getSaleStatus({ ...product, saleEndsAt: new Date(product.saleEndsAt), openingTime: store.openingTime, closingTime: store.closingTime }, now) === "on_sale");
  const waiting = data.reservations.filter((item) => item.status === "approved");

  return <main className={styles.page}><div className={styles.container}>
    <SellerNav current="/seller/dashboard" />
    {header}
    <section className={styles.summary} aria-label="오늘 현황">
      <div><span>판매 중 상품</span><strong>{onSale.length}개</strong></div>
      <div><span>픽업 대기</span><strong>{waiting.length}건</strong></div>
      <div><span>오늘 매출</span><strong>{money(data.today.revenue)}</strong></div>
    </section>
    <section aria-labelledby="waiting-title" className="mt-8">
      <div className={styles.sectionHeading}><h2 id="waiting-title">픽업 대기 예약</h2><Link href="/seller/reservations">예약 관리</Link></div>
      {waiting.length === 0 ? <p className={styles.subtle}>픽업을 기다리는 예약이 없어요.</p> : <ul className={styles.grid}>{waiting.slice(0, PREVIEW_COUNT).map((item) => {
        const view = toReservationView(item);
        return <li className={styles.card} key={view.id}><h3>{view.name}</h3><p className={styles.quantity}>{view.quantity}{view.unit} · <strong>{money(view.total)}</strong></p><p className={styles.subtle}>픽업 {view.pickup}</p></li>;
      })}</ul>}
    </section>
    <section aria-labelledby="stock-title" className="mt-8">
      <div className={styles.sectionHeading}><h2 id="stock-title">판매 중 재고</h2><Link href="/seller/products">상품·재고</Link></div>
      {onSale.length === 0 ? <p className={styles.subtle}>판매 중인 상품이 없어요. <Link href="/seller/publish">상품 게시</Link></p> : <ul className={styles.grid}>{onSale.slice(0, PREVIEW_COUNT).map((product) => <li className={styles.card} key={product.id}><h3>{product.name}</h3><p className={styles.quantity}>남은 재고 <strong>{product.availableQuantity}{product.unit}</strong></p></li>)}</ul>}
    </section>
  </div></main>;
}
