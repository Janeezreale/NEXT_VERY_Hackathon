import * as React from "react";
import type { DemoProduct } from "./demo-products";
import type { DemoStoreDisplay } from "./demo-store";
import styles from "./products.module.css";

type Props = {
  product: DemoProduct;
  store: DemoStoreDisplay;
  onChange: (product: DemoProduct) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function ProductEditForm({ product, store, onChange, onSubmit, onCancel }: Props) {
  return (
    <form onSubmit={onSubmit}>
      <p className={styles.eyebrow}>저장되지 않는 데모</p>
      <h2 id="edit-title">상품 수정 미리보기</h2>
      <p id="edit-description" className={styles.subtle}>상품 정보만 수정해 보세요. 변경 내용은 데모 화면에만 반영됩니다.</p>

      <section className={styles.formSection} aria-labelledby="product-info-title">
        <h3 id="product-info-title">상품 정보</h3>
        <div className={styles.fields}>
          <label htmlFor="demo-name">상품명 · 예시 입력</label>
          <input id="demo-name" autoFocus value={product.name} onChange={(event) => onChange({ ...product, name: event.target.value })} />
          <label htmlFor="demo-quantity">판매 가능 재고 ({product.unitLabel}) · 예시 입력</label>
          <input id="demo-quantity" type="text" value={product.quantityLabel} onChange={(event) => onChange({ ...product, quantityLabel: event.target.value })} aria-describedby="quantity-help" />
          <p id="quantity-help" className={styles.subtle}>입력 모양을 확인하는 용도입니다. 재고 차감·예약 연동·수량 검증을 수행하지 않습니다.</p>
        </div>
      </section>

      <section className={styles.formSection} aria-labelledby="price-info-title">
        <h3 id="price-info-title">가격 정보 <span className={styles.demoTag}>읽기 전용 · 데모</span></h3>
        <p id="price-help" className={styles.subtle}>정상 판매가와 최저 판매가는 향후 사장님이 설정할 항목입니다. 수정 계약 확정 전까지 예시값만 표시하며 가격 계산은 하지 않습니다.</p>
        <div className={styles.priceFields}>
          <div><label htmlFor="demo-regular-price">정상 판매가 (원)</label><input id="demo-regular-price" readOnly value={product.regularPriceLabel} aria-describedby="price-help" /></div>
          <div><label htmlFor="demo-minimum-price">최저 판매가 (원)</label><input id="demo-minimum-price" readOnly value={product.minimumPriceLabel} aria-describedby="price-help" /></div>
          <div><label htmlFor="demo-price">현재 판매가 (원)</label><input id="demo-price" readOnly value={product.priceLabel} aria-describedby="price-help" /></div>
        </div>
      </section>

      <section className={styles.storeInfo} aria-labelledby="store-info-title">
        <h3 id="store-info-title">마감은 가게 공통 설정을 참조해요</h3>
        <p>가게 예약 접수 마감: <strong>{store.reservationDeadlineLabel}</strong></p>
        <p className={styles.subtle}>가게 영업시간과 날짜를 상품마다 입력할 필요가 없어요. 공통 운영 정보는 상품 목록 상단에서 확인할 수 있어요.</p>
        <p className={styles.subtle}>데모 표시값이며 실제 예약 제한은 적용하지 않습니다. 상품별로 판매 종료를 앞당기는 기능은 아직 제공하지 않습니다.</p>
      </section>

      <p className={styles.demoNotice}>이 화면에서는 서버나 DB에 정보를 보내지 않습니다. 새로고침하면 데모 변경이 초기화됩니다.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.outline} onClick={onCancel}>취소</button>
        <button type="submit" className={styles.primary}>데모 변경 미리보기</button>
      </div>
    </form>
  );
}
