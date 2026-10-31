"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Leaf, MapPin, ShoppingBasket, Ticket } from "lucide-react";
import { money, type PreviewProduct } from "./preview-data";
import styles from "../../app/(customer)/shop/shop.module.css";

export function PreviewShell({ children, back }: { children: ReactNode; back?: string }) {
  return <main className={styles.page}>
    <p className={styles.panel} role="note">개발용 데모 데이터입니다. 실제 상품이 아니며 예약되지 않습니다.</p>
    <nav className={styles.localNav} aria-label="소비자 메뉴"><Link href="/shop" className={styles.wordmark}><Leaf size={20} aria-hidden="true" />[서비스명]</Link><div><Link href="/shop"><ShoppingBasket size={18} aria-hidden="true" />상품 탐색</Link><Link href="/shop/reservations"><Ticket size={18} aria-hidden="true" />예약 내역</Link></div></nav>
    {back && <Link href={back} className={styles.back}><ArrowLeft size={18} aria-hidden="true" />뒤로</Link>}
    {children}
    <footer className={styles.footer}>동네에서 발견하고, 매장에서 만나요.</footer>
  </main>;
}

export function ProductPhoto({ product }: { product: PreviewProduct }) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.photo}>
    {/* Remote reference photos are explicitly labelled, never presented as actual inventory. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {!failed && <img src={`https://images.unsplash.com/${product.photo}?auto=format&fit=crop&w=1000&q=80`} alt={`${product.category} 참고용 사진. 실제 판매 상품이 아닙니다.`} onError={() => setFailed(true)} />}
    {failed && <span>상품 이미지 없음</span>}
    
  </div>;
}

export function CurrentPrice({ product }: { product: PreviewProduct }) {
  return <><p className={styles.price}><span className={styles.discount}>{product.discount}% 할인</span><strong><span className={styles.srOnly}>현재가 </span>{money(product.price)}</strong><del><span className={styles.srOnly}>기준가 </span>{money(product.base)}</del></p><p className={styles.unit}>1{product.unit} · 현재가</p></>;
}

export function PickupFacts({ product }: { product: PreviewProduct }) {
  return <dl className={styles.details}><div><dt>남은 수량</dt><dd>{product.stock}{product.unit}</dd></div><div><dt>예약 마감</dt><dd>11월 1일 {product.end}</dd></div><div><dt>픽업 가능</dt><dd>11월 1일 {product.pickup}</dd></div></dl>;
}

export function StoreInfo({ product }: { product: PreviewProduct }) {
  return <section className={styles.panel}><p className={styles.eyebrow}>픽업 장소</p><h2>{product.store}</h2><p className={styles.address}><MapPin size={18} aria-hidden="true" />{product.address}</p><p className={styles.description}>선택한 시간에 방문해 상품을 확인한 후 현장에서 결제해 주세요.</p></section>;
}
