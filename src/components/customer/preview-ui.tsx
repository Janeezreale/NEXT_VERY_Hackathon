"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Leaf, MapPin, ShoppingBasket, Store, Ticket } from "lucide-react";
import { LogoutButton, SessionAuthAction } from "@/src/components/common/logout-button";
import { money, SALE_STATUS_LABELS, type ProductView } from "./product-view";
import styles from "../../app/(customer)/shop/shop.module.css";

export function PreviewShell({ children, back }: { children: ReactNode; back?: string }) {
  return <main className={styles.page}>
    <nav className={styles.localNav} aria-label="소비자 메뉴"><Link href="/shop" className={styles.wordmark}><Leaf size={20} aria-hidden="true" />라스트픽</Link><div className={styles.navLinks}><Link href="/shop"><ShoppingBasket size={18} aria-hidden="true" />상품 탐색</Link><Link href="/shop/reservations"><Ticket size={18} aria-hidden="true" />예약 내역</Link></div><SessionAuthAction /></nav>
    {back && <Link href={back} className={styles.back}><ArrowLeft size={18} aria-hidden="true" />뒤로</Link>}
    {children}
    <footer className={styles.footer}>동네에서 발견하고, 매장에서 만나요.</footer>
  </main>;
}

/** 지금 계정으로 할 수 없는 일을 알리고 계정을 바꿀 수 있게 한다. */
export function AccountNotice({ children }: { children: ReactNode }) {
  return <div className={styles.info} role="alert"><p>{children}</p><LogoutButton className="mt-3" label="다른 계정으로 로그인" /></div>;
}

export function ProductPhoto({ product }: { product: Pick<ProductView, "name" | "photo"> }) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.photo}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {product.photo && !failed && <img src={product.photo} alt={product.name} onError={() => setFailed(true)} />}
    {(!product.photo || failed) && <span>이미지 없음</span>}
    
  </div>;
}

export function CurrentPrice({ product }: { product: ProductView }) {
  return <><p className={styles.price}><span className={styles.discount}>{product.discount}% 할인</span><strong><span className={styles.srOnly}>현재가 </span>{money(product.price)}</strong><del><span className={styles.srOnly}>기준가 </span>{money(product.base)}</del></p><p className={styles.unit}>1{product.unit} · {product.pricedAt} 기준 현재가</p></>;
}

export function PickupFacts({ product }: { product: ProductView }) {
  return <dl className={styles.details}><div><dt>남은 수량</dt><dd>{product.stock}{product.unit}</dd></div><div><dt>예약 마감</dt><dd>{product.dateLabel} {product.end}</dd></div><div><dt>픽업 가능</dt><dd>{product.dateLabel} {product.pickup}</dd></div></dl>;
}

export function ProductCard({ product, href, distance }: { product: ProductView; href: string; distance?: string }) {
  return <article className={styles.card}><ProductPhoto product={product} /><div className={styles.cardBody}><p className={styles.store}><Store size={14} aria-hidden="true" />{product.store}{distance && ` · ${distance}`}</p><h3>{product.name}</h3><CurrentPrice product={product} />{product.notice ? <><span className={styles.badge} data-status="예약 취소">{SALE_STATUS_LABELS[product.saleStatus]}</span><p className={styles.notice}>{product.notice}</p></> : <PickupFacts product={product} />}<Link href={href} className={styles.detailButton}>상품 상세 보기<ArrowRight size={18} aria-hidden="true" /></Link></div></article>;
}

export function StoreInfo({ product }: { product: ProductView }) {
  return <section className={styles.panel}><p className={styles.eyebrow}>픽업 장소</p><h2>{product.store}</h2><p className={styles.address}><MapPin size={18} aria-hidden="true" />{product.address}</p><p className={styles.description}>영업시간 {product.hours}</p><p className={styles.description}>선택한 시간에 방문해 상품을 확인한 후 현장에서 결제해 주세요.</p></section>;
}
