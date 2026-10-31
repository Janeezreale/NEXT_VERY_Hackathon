"use client";
import Link from "next/link";

import { Check, Clock } from "lucide-react";
import type { PreviewProduct } from "./preview-data";
import { CurrentPrice, PickupFacts, PreviewShell, ProductPhoto, StoreInfo } from "./preview-ui";
import styles from "../../app/(customer)/shop/shop.module.css";

export default function ProductPreview({ product }: { product: PreviewProduct }) {
  const state: string = "판매 중";
  const available = state === "판매 중";
  return <PreviewShell back="/shop">
    <div className={styles.detailGrid}><ProductPhoto product={product} /><section className={styles.panel}><p className={styles.eyebrow}>{product.store}</p><h1 className={styles.productTitle}>{product.name}</h1><span className={styles.badge}><Check size={14} aria-hidden="true" />{state}</span><CurrentPrice product={product} />{available ? <PickupFacts product={product} /> : <p className={styles.notice}>{state === "품절" ? "남은 수량 0개 · 품절 시나리오예요." : "예약 마감 시간이 지난 시나리오예요."}</p>}<p className={styles.info}><Clock size={18} aria-hidden="true" />판매자 승인 후 예약이 확정돼요.<br />현재가는 예약 시 달라질 수 있어요.</p>{available ? <Link className={styles.primary} href={`/shop/products/${product.id}/reserve`}>픽업 예약하기</Link> : <><button className={styles.primary} disabled>{state}</button><p className={styles.description}>이 상태에서는 신규 예약을 요청할 수 없어요.</p></>}</section></div>
    <div className={styles.detailGrid}><section className={styles.panel}><p className={styles.eyebrow}>상품을 더 알아보세요</p><h2>상품 안내</h2><p className={styles.description}>{product.description}</p></section><StoreInfo product={product} /></div>
  </PreviewShell>;
}
