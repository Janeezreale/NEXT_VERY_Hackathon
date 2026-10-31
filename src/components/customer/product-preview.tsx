"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, AlertCircle } from "lucide-react";
import { LiveRefresh } from "@/src/components/common/live-refresh";
import { SALE_STATUS_LABELS, type ProductView } from "./product-view";
import { CurrentPrice, PickupFacts, PreviewShell, ProductPhoto, StoreInfo } from "./preview-ui";
import { EmptyFeedback, LoadFeedback } from "./preview-feedback";
import type { LoadState } from "./preview-state";
import styles from "../../app/(customer)/shop/shop.module.css";

export default function ProductPreview({ product, state = "ready", back = "/shop", detailUrl }: { product?: ProductView; state?: LoadState; back?: string; detailUrl: string }) {
  const router = useRouter();
  if (state !== "ready") return <PreviewShell back={back}><h1 className={styles.productTitle}>상품 상세</h1><LoadFeedback state={state} subject="상품을" onRetry={() => router.refresh()} /></PreviewShell>;
  if (!product) return <PreviewShell back={back}><h1 className={styles.productTitle}>상품 상세</h1><EmptyFeedback title="상품을 찾을 수 없어요" description="목록에서 다른 상품을 선택해 주세요." /><Link className={styles.back} href={back}>상품 목록으로</Link></PreviewShell>;
  const available = !product.notice;
  return <PreviewShell back={back}>
    <LiveRefresh />
    <div className={styles.detailGrid}><ProductPhoto product={product} /><section className={styles.panel}><p className={styles.eyebrow}>{product.store}</p><h1 className={styles.productTitle}>{product.name}</h1><span className={styles.badge} data-status={available ? undefined : "예약 취소"}>{available ? <Check size={14} aria-hidden="true" /> : <AlertCircle size={14} aria-hidden="true" />}{SALE_STATUS_LABELS[product.saleStatus]}</span><CurrentPrice product={product} />{available ? <PickupFacts product={product} /> : <p className={styles.notice} id="availability-reason">{product.notice}</p>}<p className={styles.info}><Clock size={18} aria-hidden="true" />예약하면 바로 확정돼요.<br />현재가는 예약 시 달라질 수 있어요.</p>{available ? <Link className={styles.primary} href={detailUrl.replace(/(\?|$)/, "/reserve$1")}>픽업 예약하기</Link> : <><button className={styles.primary} disabled aria-describedby="availability-reason">예약 불가</button></>}</section></div>
    <div className={styles.detailGrid}>{product.description && <section className={styles.panel}><p className={styles.eyebrow}>상품을 더 알아보세요</p><h2>상품 안내</h2><p className={styles.description}>{product.description}</p></section>}<StoreInfo product={product} /></div>
  </PreviewShell>;
}