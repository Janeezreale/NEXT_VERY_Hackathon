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

/**
 * 현재 영업일의 가게 마감 시각. closingTime은 한국 시간 "HH:mm"이다.
 * 영업일은 오전 6시에 바뀌므로 00:10 마감은 다음 날 새벽 00:10이다.
 */
export function getTodayClosing(closingTime: string, now: Date): Date {
  const startHour = config.businessDayStartHour;
  const businessDay = new Intl.DateTimeFormat("en-CA", { timeZone: config.timeZone }).format(now.getTime() - startHour * HOUR_MS);
  const closing = new Date(`${businessDay}T${closingTime}:00${config.timeZoneOffset}`);
  return Number(closingTime.slice(0, 2)) < startHour ? new Date(closing.getTime() + 24 * HOUR_MS) : closing;
}

/** 상품 판매 종료와 오늘 가게 마감 30분 전 중 이른 시각. 가격과 예약 차단의 공통 기준이다. */
export function getSaleDeadline(saleEndsAt: Date, closingTime: string, now: Date): Date {
  const cutoff = new Date(getTodayClosing(closingTime, now).getTime() - config.reservationCutoffMinutes * MINUTE_MS);
  return saleEndsAt < cutoff ? saleEndsAt : cutoff;
}

/** 판매 종료가 그날 예약 마감을 넘으면 입력 오류 문구를 돌려준다. 화면과 서버가 같은 규칙을 쓴다. */
export function saleEndError(saleEndsAt: Date, closingTime: string): string | null {
  const deadline = getSaleDeadline(saleEndsAt, closingTime, saleEndsAt);
  if (deadline >= saleEndsAt) return null;
  const latest = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: config.timeZone }).format(deadline);
  return `판매 종료는 가게 마감(${closingTime}) 30분 전인 ${latest}까지만 설정할 수 있어요.`;
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
