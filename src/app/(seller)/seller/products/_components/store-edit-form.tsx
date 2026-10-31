import * as React from "react";
import type { DemoStoreDisplay } from "./demo-store";
import styles from "./products.module.css";

type Props = {
  store: DemoStoreDisplay;
  onChange: (store: DemoStoreDisplay) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function StoreEditForm({ store, onChange, onSubmit, onCancel }: Props) {
  return (
    <form onSubmit={onSubmit}>
      <p className={styles.eyebrow}>가게 공통 정보 · 저장되지 않는 데모</p>
      <h2 id="store-edit-title">가게 정보 수정 미리보기</h2>
      <p id="store-edit-description" className={styles.subtle}>한 번 변경하면 모든 상품에서 같은 가게 정보를 참조해요. 실제 가게 설정은 저장되지 않습니다.</p>
      <div className={styles.fields}>
        <label htmlFor="store-name">가게 이름 · 데모</label>
        <input id="store-name" autoFocus value={store.nameLabel} onChange={(event) => onChange({ ...store, nameLabel: event.target.value })} />
        <label htmlFor="store-address">주소 · 데모</label>
        <input id="store-address" value={store.addressLabel} onChange={(event) => onChange({ ...store, addressLabel: event.target.value })} />
        <label htmlFor="store-hours">영업시간 표시 · 한국 시간</label>
        <input id="store-hours" value={store.businessHoursLabel} onChange={(event) => onChange({ ...store, businessHoursLabel: event.target.value })} aria-describedby="store-time-help" />
        <label htmlFor="store-deadline">예약 접수 마감 표시 · 한국 시간</label>
        <input id="store-deadline" value={store.reservationDeadlineLabel} onChange={(event) => onChange({ ...store, reservationDeadlineLabel: event.target.value })} aria-describedby="store-time-help" />
        <p id="store-time-help" className={styles.subtle}>시간은 데모 표시 문구입니다. 날짜 입력은 필요 없으며, 영업시간을 바꿔도 예약 접수 마감은 자동 계산되지 않아요.</p>
      </div>
      <p className={styles.policyDraft}><strong>정책 초안 · 총괄 승인 전</strong><br />{store.reservationPolicyDraftLabel}</p>
      <p className={styles.policyNote}>실제 예약 제한이나 상품별 판매 종료 시점은 변경하지 않습니다.</p>
      <p className={styles.demoNotice}>데모 변경은 화면에만 반영됩니다. 서버·DB에 저장하지 않으며 새로고침하면 초기화됩니다.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.outline} onClick={onCancel}>취소</button>
        <button type="submit" className={styles.primary}>가게 정보 데모 반영</button>
      </div>
    </form>
  );
}
