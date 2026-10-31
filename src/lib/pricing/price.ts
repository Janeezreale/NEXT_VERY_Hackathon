import type { Freshness } from "../../types/api";
import { PRICING_CONFIG as config } from "./config";

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export type PriceInput = {
  basePrice: number;
  minPrice: number;
  freshness: Freshness;
  /** getSaleDeadline의 결과 */
  deadline: Date;
  createdAt: Date;
  /** 최근 60분 승인 수량. 건수가 아니다. */
  recentApprovedQuantity: number;
  now: Date;
};

/** 오늘 매장 마감 시각. closingTime은 한국 시간 "HH:mm"이고 자정을 넘는 영업은 지원하지 않는다. */
export function getTodayClosing(closingTime: string, now: Date): Date {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: config.timeZone }).format(now);
  return new Date(`${today}T${closingTime}:00${config.timeZoneOffset}`);
}

/** 상품 판매 종료와 오늘 매장 마감 중 이른 시각. 가격과 예약 차단의 공통 기준이다. */
export function getSaleDeadline(saleEndsAt: Date, closingTime: string, now: Date): Date {
  const closing = getTodayClosing(closingTime, now);
  return saleEndsAt < closing ? saleEndsAt : closing;
}

export function isSaleOpen(deadline: Date, now: Date): boolean {
  return now < deadline;
}

function deadlineDiscount(deadline: Date, now: Date): number {
  const hoursLeft = (deadline.getTime() - now.getTime()) / HOUR_MS;
  if (hoursLeft <= config.deadline.urgentHours) return config.deadline.urgentDiscount;
  if (hoursLeft <= config.deadline.soonHours) return config.deadline.soonDiscount;
  return 0;
}

function demandDiscount(createdAt: Date, recentApprovedQuantity: number, now: Date): number {
  if (recentApprovedQuantity >= config.demand.busyQuantity) return config.demand.busyDiscount;
  const listedMinutes = (now.getTime() - createdAt.getTime()) / MINUTE_MS;
  if (recentApprovedQuantity === 0 && listedMinutes >= config.demand.idleAfterMinutes) {
    return config.demand.idleDiscount;
  }
  return 0;
}

function assertValidPrices({ basePrice, minPrice, recentApprovedQuantity }: PriceInput) {
  const amounts = [basePrice, minPrice, recentApprovedQuantity];
  if (!amounts.every(Number.isInteger) || basePrice <= 0 || minPrice <= 0 || recentApprovedQuantity < 0) {
    throw new RangeError("가격과 수량은 정해진 범위의 정수여야 합니다.");
  }
  if (minPrice > basePrice) throw new RangeError("최저가는 기준가보다 클 수 없습니다.");
}

/** 현재가를 계산한다. discountRate는 최저가를 적용한 뒤 실제 기준가 대비 할인율이다. */
export function calculatePrice(input: PriceInput): { currentPrice: number; discountRate: number } {
  assertValidPrices(input);
  const { basePrice, minPrice, freshness, deadline, createdAt, recentApprovedQuantity, now } = input;

  const total =
    config.freshnessDiscount[freshness] +
    deadlineDiscount(deadline, now) +
    demandDiscount(createdAt, recentApprovedQuantity, now);
  const rate = Math.min(Math.max(total, 0), config.maxDiscount);

  const currentPrice = Math.max(Math.round((basePrice * (100 - rate)) / 100), minPrice);
  return { currentPrice, discountRate: Math.round(((basePrice - currentPrice) / basePrice) * 100) };
}
