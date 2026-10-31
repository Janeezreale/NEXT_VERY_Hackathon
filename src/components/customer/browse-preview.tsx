"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Leaf, MapPin, RotateCcw, ShoppingBasket, Store } from "lucide-react";
import { previewProducts } from "./preview-data";
import { CurrentPrice, PickupFacts, PreviewShell, ProductPhoto } from "./preview-ui";
import { EmptyFeedback, LoadFeedback } from "./preview-feedback";
import { browseUrl, contextQuery, filtersFrom, regions, categories, type LoadState } from "./preview-state";
import styles from "../../app/(customer)/shop/shop.module.css";

type Filters = ReturnType<typeof filtersFrom>;
export default function BrowsePreview({ filters, state = "ready", forceEmpty = false }: { filters: Filters; state?: LoadState; forceEmpty?: boolean }) {
  const router = useRouter();
  const filtered = forceEmpty ? [] : previewProducts.filter(item => item.region === filters.region && (filters.category === "전체" || item.category === filters.category));
  const change = (patch: Partial<Filters>) => router.push(browseUrl({ ...filters, ...patch }), { scroll: false });
  const reset = () => change({ category: "전체" });
  const context = contextQuery(filters);
  return <PreviewShell>
    <header className={styles.heading}><div><p className={styles.eyebrow}><Leaf size={16} aria-hidden="true" />우리 동네의 신선한 발견</p><h1>가까운 동네에서,<br />가볍게 만나는 신선함</h1><p className={styles.description}>필요한 만큼 골라 담고, 매장에서 직접 픽업하세요.</p></div><div className={styles.headingIcon} aria-hidden="true"><ShoppingBasket size={64} strokeWidth={1.3} /></div></header>
    <section className={styles.filters} aria-label="상품 탐색 조건">
      <label className={styles.region}><span><MapPin size={18} aria-hidden="true" />둘러볼 지역</span><select value={filters.region} onChange={event => change({ region: event.target.value })}><option value="">지역을 선택해 주세요</option>{regions.map(region => <option key={region}>{region}</option>)}</select></label>
      {[{ label: "품목", key: "category" as const, values: categories }].map(group => <div key={group.key} role="group" aria-label={group.label}><span className={styles.label}>{group.label}</span><div className={styles.chips}>{group.values.map(value => <button key={value} type="button" aria-pressed={filters[group.key] === value} onClick={() => change({ [group.key]: value })}>{value}</button>)}</div></div>)}
    </section>
    <div className={styles.resultsHeading}><div><h2>{filters.region ? `${filters.region}의 상품` : "우리 동네 상품"}</h2>{filters.region && state === "ready" && <p role="status">조건에 맞는 상품 · {filtered.length}개</p>}</div><button className={styles.reset} onClick={reset}><RotateCcw size={16} aria-hidden="true" />필터 초기화</button></div>
    {!filters.region ? <EmptyFeedback title="둘러볼 지역을 선택해 주세요" description="지역을 선택하면 해당 동네의 상품을 볼 수 있어요." /> : state !== "ready" ? <LoadFeedback state={state} subject="상품을" onRetry={() => router.replace(browseUrl(filters), { scroll: false })} /> : filtered.length === 0 ? <EmptyFeedback title="조건에 맞는 상품이 없어요" description="필터를 초기화하거나 다른 지역을 선택해 보세요." action="필터 초기화" onAction={reset} /> : <section className={styles.browseList} aria-label="상품 목록">{filtered.map(product => <article className={styles.card} key={product.id}><ProductPhoto product={product} /><div className={styles.cardBody}><p className={styles.store}><Store size={14} aria-hidden="true" />{product.store}</p><h3>{product.name}</h3><CurrentPrice product={product} /><PickupFacts product={product} /><Link href={`/shop/products/${product.id}${context ? `?${context}` : ""}`} className={styles.detailButton}>상품 상세 보기<ArrowRight size={18} aria-hidden="true" /></Link></div></article>)}</section>}
  </PreviewShell>;
}