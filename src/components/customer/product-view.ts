import { PRICING_CONFIG } from "@/src/lib/pricing/config";
import type { Product, Store } from "@/src/types/api";

export const money = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";

const SLOT_MINUTES = 30;
const MAX_SLOTS = 6;

const time = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: PRICING_CONFIG.timeZone });
const date = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: PRICING_CONFIG.timeZone });

export type PickupSlot = { label: string; at: string };

/** 소비자 카드·상세가 쓰는 표시값. 시각은 한국 시간 문자열이다. */
export type ProductView = {
  id: string;
  name: string;
  store: string;
  address: string;
  price: number;
  base: number;
  discount: number;
  stock: number;
  unit: string;
  dateLabel: string;
  end: string;
  pickup: string;
  slots: PickupSlot[];
  photo: string | null;
  description: string | null;
};

/** 다음 정시·30분부터 판매 마감까지의 방문 시각. 없으면 판매 마감 시각을 고른다. */
export function pickupSlots(now: Date, deadline: Date): PickupSlot[] {
  const step = SLOT_MINUTES * 60 * 1000;
  const slots: PickupSlot[] = [];
  for (let at = Math.ceil(now.getTime() / step) * step; at <= deadline.getTime() && slots.length < MAX_SLOTS; at += step) {
    slots.push({ label: time.format(at), at: new Date(at).toISOString() });
  }
  return slots.length > 0 ? slots : [{ label: time.format(deadline), at: deadline.toISOString() }];
}

export function toProductView(product: Product, store: Pick<Store, "name" | "address">, now: Date): ProductView {
  const deadline = new Date(product.saleDeadline);
  const slots = pickupSlots(now, deadline);
  return {
    id: product.id,
    name: product.name,
    store: store.name,
    address: store.address,
    price: product.currentPrice,
    base: product.basePrice,
    discount: product.discountRate,
    stock: product.availableQuantity,
    unit: product.unit,
    dateLabel: date.format(deadline),
    end: time.format(deadline),
    pickup: `${slots[0].label}–${time.format(deadline)}`,
    slots,
    photo: null,
    description: null,
  };
}
