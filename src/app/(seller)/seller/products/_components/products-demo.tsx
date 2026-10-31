"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Check, Clock3, ImageOff, Package, Pencil, RotateCcw, TriangleAlert } from "lucide-react";
import { demoProducts, type DemoProduct } from "./demo-products";
import { demoStore, type DemoStoreDisplay } from "./demo-store";
import ProductEditForm from "./product-edit-form";
import StoreOverview from "./store-overview";
import StoreEditForm from "./store-edit-form";
import styles from "./products.module.css";

type View = "list" | "loading" | "empty" | "error";

export default function ProductsDemo() {
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState("전체");
  const [products, setProducts] = useState(demoProducts);
  const [store, setStore] = useState<DemoStoreDisplay>(demoStore);
  const [storeEditing, setStoreEditing] = useState<DemoStoreDisplay | null>(null);
  const [editing, setEditing] = useState<DemoProduct | null>(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const storeDialog = useRef<HTMLDialogElement>(null);
  const visible = products.filter((product) => filter === "전체" || product.status === filter);

  function edit(product: DemoProduct) {
    setEditing({ ...product });
    dialog.current?.showModal();
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <aside className={styles.demoNotice} aria-label="개발용 데모 안내">
          <strong>UI 미리보기 · 개발용 데모</strong>
          <p>상품·가격·상태는 모두 예시입니다. 실제 조회나 저장은 하지 않으며 새로고침하면 초기화됩니다.</p>
        </aside>

        <header className={styles.header}>
          <div><p className={styles.eyebrow}>판매자 · 상품 관리</p><h1>내 상품과 재고</h1><p className={styles.subtle}>남은 수량을 확인하고 상품 정보를 살펴보세요.</p></div>
          <a className={styles.primary} href="/seller/publish">상품 게시</a>
        </header>

        <StoreOverview store={store} onEdit={() => { setStoreEditing({ ...store }); storeDialog.current?.showModal(); }} />

        <section className={styles.previewControls} aria-label="데모 화면 상태 선택">
          <label htmlFor="demo-view">화면 상태 미리보기</label>
          <select id="demo-view" value={view} onChange={(event) => { setView(event.target.value as View); setNotice(""); }}>
            <option value="list">상품 목록</option><option value="loading">로딩</option><option value="empty">빈 목록</option><option value="error">오류</option>
          </select>
          <span>실제 통신 없이 화면만 전환합니다.</span>
        </section>

        <div className={styles.filters} role="group" aria-label="데모 상품 상태 필터">
          {["전체", "판매 중", "마감 임박", "품절"].map((label) => <button key={label} type="button" aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>)}
        </div>
        <p className={styles.policyNote}>마감 임박·판매 상태는 시안용 지정값입니다. 변경한 수량으로 상태를 자동 판정하지 않습니다.</p>
        <p className={styles.liveNotice} role="status">{notice}</p>

        {view === "loading" ? <section aria-label="상품 불러오는 중" aria-busy="true"><p className={styles.subtle} role="status">상품을 불러오는 중이에요. (데모)</p><div className={styles.grid}>{[1, 2, 3].map((key) => <div className={styles.skeleton} key={key} aria-hidden="true"><div /><span /><span /><span /></div>)}</div></section>
          : view === "error" ? <section className={styles.empty} role="alert"><TriangleAlert size={36} aria-hidden="true" /><h2>상품을 불러오지 못했어요</h2><p>오류 화면 예시입니다. 실제 서버 오류가 아닙니다.</p><button className={styles.primary} onClick={() => { setView("list"); setNotice("데모 목록으로 돌아왔어요. 실제 재요청은 하지 않았어요."); }}><RotateCcw size={18} aria-hidden="true" />다시 시도 · 데모</button></section>
          : view === "empty" || visible.length === 0 ? <section className={styles.empty}><Package size={40} aria-hidden="true" /><h2>{view === "empty" ? "아직 등록된 상품이 없어요" : "조건에 맞는 상품이 없어요"}</h2><p>빈 목록 화면 예시입니다. 상품 등록 기능은 이 데모에 포함되지 않아요.</p><button className={styles.outline} onClick={() => { setView("list"); setFilter("전체"); }}><ArrowLeft size={18} aria-hidden="true" />데모 상품 보기</button></section>
          : <section aria-label="등록된 데모 상품"><div className={styles.listHeading}><h2>상품 목록</h2><span>데모 {visible.length}개</span></div><div className={styles.grid}>{visible.map((product) => <article className={styles.card} key={product.id}>
            <div className={styles.photo}>
              {product.illustration ? <svg viewBox="0 0 400 300" role="img" aria-label="사과 모양의 데모 일러스트 · 실제 상품 사진 아님"><rect width="400" height="300" fill="#EAF6EF" /><ellipse cx="200" cy="240" rx="108" ry="15" fill="#D6E8DA" /><path d="M201 108C143 63 97 130 120 193c23 63 61 47 81 37 26 16 63 20 84-42 20-60-25-121-84-80Z" fill="#D96A50" /><path d="M201 113c-3-25 6-39 15-48" fill="none" stroke="#70553D" strokeWidth="9" strokeLinecap="round" /><path d="M208 88c9-35 47-35 53-30-7 30-34 43-53 30" fill="#248A60" /><path d="M150 128c-13 12-15 28-13 40" fill="none" stroke="#F6BA9E" strokeWidth="9" strokeLinecap="round" /></svg> : <div className={styles.noImage}><ImageOff size={30} aria-hidden="true" /><span>상품 이미지 없음</span></div>}
              <span className={styles.imageCaption}>{product.illustration ? "데모 일러스트" : "데모 · 사진 미등록"}</span>
            </div>
            <div className={styles.cardBody}><span className={`${styles.badge} ${product.status === "마감 임박" ? styles.warning : product.status === "품절" ? styles.neutral : styles.success}`}>{product.status === "마감 임박" ? <Clock3 size={14} aria-hidden="true" /> : product.status === "품절" ? <Package size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{product.status}</span>
              <h3>{product.name}</h3><p className={styles.price}><span className={styles.srOnly}>데모 판매가 </span>{product.priceLabel}<span> / {product.unitLabel}</span></p>
              <dl className={styles.details}><div><dt>판매 가능 재고</dt><dd>{product.quantityLabel}{product.unitLabel}</dd></div><div><dt>가게 예약 마감 · 데모</dt><dd>{store.reservationDeadlineLabel}</dd></div><div><dt>상품 판매 종료 · 예시</dt><dd>{product.deadlineLabel}</dd></div></dl>
              <button className={styles.outline} onClick={() => edit(product)} aria-label={`${product.name} 상품 수정 데모`}><Pencil size={16} aria-hidden="true" />상품 수정 · 데모</button>
            </div>
          </article>)}</div></section>}

        <dialog ref={dialog} className={styles.dialog} aria-labelledby="edit-title" aria-describedby="edit-description" onClose={() => setEditing(null)}>
          {editing && <ProductEditForm product={editing} store={store} onChange={setEditing} onCancel={() => dialog.current?.close()} onSubmit={(event) => {
            event.preventDefault();
            setProducts(products.map((product) => product.id === editing.id ? editing : product));
            setNotice("데모 변경을 화면에만 반영했어요. 실제 저장되지 않으며 새로고침하면 사라집니다.");
            dialog.current?.close();
          }} />}
        </dialog>

        <dialog ref={storeDialog} className={styles.dialog} aria-labelledby="store-edit-title" aria-describedby="store-edit-description" onClose={() => setStoreEditing(null)}>
          {storeEditing && <StoreEditForm store={storeEditing} onChange={setStoreEditing} onCancel={() => storeDialog.current?.close()} onSubmit={(event) => {
            event.preventDefault();
            setStore({ ...storeEditing });
            setNotice("가게 공통 정보를 모든 상품의 데모 표시에 반영했어요. 실제 저장되지 않으며 새로고침하면 초기화됩니다.");
            storeDialog.current?.close();
          }} />}
        </dialog>
      </div>
    </main>
  );
}
