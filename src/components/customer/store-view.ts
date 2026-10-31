import { getStoreStatus } from "@/src/lib/pricing/price";
import type { Store } from "@/src/types/api";

const STORE_STATUS_LABELS = { before_open: "영업 전", open: "영업 중", closed: "오늘 영업 마감" };

/** 지도와 가게 프로필이 쓰는 표시값 */
export type StoreView = {
  id: string;
  name: string;
  region: string;
  address: string;
  description: string | null;
  phone: string | null;
  phoneLabel: string | null;
  status: string;
  hours: string;
};

function formatPhone(phone: string) {
  return phone.replace(/^(02|0\d{2})(\d{3,4})(\d{4})$/, "$1-$2-$3");
}

export function toStoreView(store: Store, now: Date): StoreView {
  return {
    id: store.id,
    name: store.name,
    region: store.regionCode,
    address: store.address,
    description: store.description,
    phone: store.phone,
    phoneLabel: store.phone ? formatPhone(store.phone) : null,
    status: STORE_STATUS_LABELS[getStoreStatus(store.openingTime, store.closingTime, now)],
    hours: `${store.openingTime}–${store.closingTime}`,
  };
}
