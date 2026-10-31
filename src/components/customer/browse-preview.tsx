"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Leaf, MapPin, RotateCcw, ShoppingBasket, Store } from "lucide-react";
import { previewProducts } from "./preview-data";
import { CurrentPrice, PickupFacts, PreviewShell, ProductPhoto } from "./preview-ui";
import styles from "../../app/(customer)/shop/shop.module.css";

export default function BrowsePreview() {
  const [region, setRegion] = useState("샘플 동네 A");
  const [business, setBusiness] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [view, setView] = useState("상품");
  const filtered = previewProducts.filter(item => item.region === region && (business === "전체" || item.business === business) && (category === "전체" || item.category === category));
  const reset = () => { setBusiness("전체"); setCategory("전체"); };
  return <PreviewShell>
    <header className={styles.heading}><div><p className={styles.eyebrow}><Leaf size={16} aria-hidden="true" />우리 동네의 신선한 발견</p><h1>가까운 동네에서,<br />가볍게 만나는 신선함</h1><p className={styles.description}>필요한 만큼 골라 담고, 매장에서 직접 픽업하세요.</p></div><div className={styles.headingIcon} aria-hidden="true"><ShoppingBasket size={64} strokeWidth={1.3} /></div></header>
    <section className={styles.filters} aria-label="상품 탐색 조건"><label className={styles.region}><span><MapPin size={18} aria-hidden="true" />둘러볼 지역</span><select value={region} onChange={event => setRegion(event.target.value)}><option>샘플 동네 A</option><option>샘플 동네 B</option></select></label>
    {[{ label: "업종", value: business, values: ["전체", "과일·채소", "꽃집"], change: setBusiness }, { label: "품목", value: category, values: ["전체", "채소", "과일", "꽃"], change: setCategory }].map(group => <div key={group.label} role="group" aria-label={group.label}><span className={styles.label}>{group.label}</span><div className={styles.chips}>{group.values.map(value => <button key={value} type="button" aria-pressed={group.value === value} onClick={() => group.change(value)}>{value}</button>)}</div></div>)}</section>
    <div className={styles.resultsHeading}><div><h2>{region}의 상품</h2><p>판매 중 상품 · {filtered.length}개</p></div><button className={styles.reset} onClick={reset}><RotateCcw size={16} aria-hidden="true" />필터 초기화</button></div>
    
    <section aria-label="상품 목록" aria-busy={view === "로딩"}>{view === "로딩" ? <><p role="status">불러오는 중</p><div className={styles.browseList} aria-hidden="true">{[1, 2, 3].map(id => <div className={styles.skeleton} key={id} />)}</div></> : view === "오류" ? <div className={styles.empty} role="alert"><h3>상품을 불러오지 못했어요</h3><p>잠시 후 다시 시도해 주세요.</p><button className={styles.primary} onClick={() => setView("상품")}>다시 시도</button></div> : view === "빈 결과" || filtered.length === 0 ? <div className={styles.empty}><ShoppingBasket size={36} aria-hidden="true" /><h3>조건에 맞는 상품이 없어요</h3><p>다른 지역이나 품목을 선택해 보세요.</p><button className={styles.primary} onClick={() => { reset(); setRegion("샘플 동네 A"); setView("상품"); }}>탐색 조건 초기화</button></div> : <div className={styles.browseList}>{filtered.map(product => <article className={styles.card} key={product.id}><ProductPhoto product={product} /><div className={styles.cardBody}><p className={styles.store}><Store size={14} aria-hidden="true" />{product.store}</p><h3>{product.name}</h3><CurrentPrice product={product} /><PickupFacts product={product} /><Link href={`/shop/products/${product.id}`} className={styles.detailButton}>상품 상세 보기<ArrowRight size={18} aria-hidden="true" /></Link></div></article>)}</div>}</section>
  </PreviewShell>;
}
