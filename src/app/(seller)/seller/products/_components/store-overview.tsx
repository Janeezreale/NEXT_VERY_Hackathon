import * as React from "react";
import type { DemoStoreDisplay } from "./demo-store";
import styles from "./products.module.css";

export default function StoreOverview({ store, onEdit }: { store: DemoStoreDisplay; onEdit: () => void }) {
  return (
    <section className={styles.storeInfo} aria-labelledby="store-overview-title">
      <div className={styles.storeHeading}>
        <h2 id="store-overview-title">우리 가게 공통 운영 정보</h2>
        <span className={styles.demoTag}>가게 설정 · 개발용 데모</span>
        <button type="button" className={styles.outline} onClick={onEdit}>가게 정보 수정 · 데모</button>
      </div>
      <p className={styles.subtle}>가게 이름·주소·영업시간은 최초 가게 등록 시 한 번 설정하고, 등록한 상품이 함께 참조하는 구조입니다.</p>
      <dl className={styles.details}>
        <div><dt>가게 이름</dt><dd>{store.nameLabel}</dd></div>
        <div><dt>주소</dt><dd>{store.addressLabel}</dd></div>
        <div><dt>영업시간</dt><dd>{store.businessHoursLabel}</dd></div>
        <div><dt>가게 예약 접수 마감</dt><dd>{store.reservationDeadlineLabel}</dd></div>
      </dl>
      <p className={styles.policyDraft}><strong>정책 초안 · 총괄 승인 전</strong><br />{store.reservationPolicyDraftLabel}</p>
      <p className={styles.subtle}>가게 설정 API가 없어 데모 표시값을 사용합니다. 변경은 이 화면에만 반영되며 실제 저장·마감 계산·예약 제한은 하지 않습니다.</p>
      <p className={styles.subtle}>상품별로 더 이른 판매 종료 시점을 정하는 흐름은 정책·데이터 계약 확정 후 연결합니다.</p>
    </section>
  );
}
