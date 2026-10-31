import { PRICING_CONFIG } from "@/src/lib/pricing/config";
import type { Product, SaleStatus, Store } from "@/src/types/api";

export const money = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";

const SLOT_MINUTES = 30;
const MAX_SLOTS = 6;

const time = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: PRICING_CONFIG.timeZone });
const date = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: PRICING_CONFIG.timeZone });

export type PickupSlot = { label: string; at: string };

/** 입력 중인 예약 수량. 숫자만 남기고 재고를 넘지 않게 한다. 지우는 중에는 빈 값을 허용한다. */
export function normalizeQuantity(value: string, stock: number) {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  return digits && Number(digits) > stock ? String(stock) : digits;
}

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  on_sale: "판매 중",
  sold_out: "품절",
  before_open: "영업 전",
  store_closed: "오늘 마감",
  sale_ended: "판매 종료",
};

/** 예약할 수 없는 이유. 예약 가능하면 null이다. */
function saleNotice(status: SaleStatus, openingTime: string, hours: string): string | null {
  if (status === "on_sale") return null;
  if (status === "before_open") return `아직 영업 전이에요. ${openingTime}부터 예약할 수 있어요.`;
  if (status === "store_closed") return `오늘 예약이 마감되었어요. 영업시간은 ${hours}이에요.`;
  return status === "sold_out" ? "남은 수량이 없어 예약할 수 없어요." : "판매가 종료되어 신규 예약을 할 수 없어요.";
}

/** 소비자 카드·상세가 쓰는 표시값. 시각은 한국 시간 문자열이다. */
export type ProductView = {
  id: string;
  name: string;
  store: string;
  address: string;
  /** 가게 좌표. 주소를 직접 입력한 가게는 null이다. */
  latitude: number | null;
  longitude: number | null;
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
  saleStatus: SaleStatus;
  hours: string;
  /** 현재가를 계산한 한국 시각 */
  pricedAt: string;
  /** 예약할 수 없는 이유. 예약 가능하면 null이다. */
  notice: string | null;
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

export function toProductView(product: Product, store: Pick<Store, "name" | "address" | "openingTime" | "closingTime" | "latitude" | "longitude">, now: Date): ProductView {
  const deadline = new Date(product.saleDeadline);
  const slots = pickupSlots(now, deadline);
  const hours = `${store.openingTime}–${store.closingTime}`;
  return {
    id: product.id,
    name: product.name,
    store: store.name,
    address: store.address,
    latitude: store.latitude,
    longitude: store.longitude,
    price: product.currentPrice,
    base: product.basePrice,
    discount: product.discountRate,
    stock: product.availableQuantity,
    unit: product.unit,
    dateLabel: date.format(deadline),
    end: time.format(deadline),
    pickup: `${slots[0].label}–${time.format(deadline)}`,
    slots,
    photo: product.imageUrls[0] ?? null,
    description: null,
    saleStatus: product.saleStatus,
    hours,
    pricedAt: time.format(new Date(product.pricedAt)),
    notice: saleNotice(product.saleStatus, store.openingTime, hours),
  };
}
