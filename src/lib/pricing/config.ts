import type { Freshness } from "../../types/api";

/** 할인율은 %p 단위다. 정책은 docs/PRICING.md, 수치는 해커톤 가설이다. */
export const PRICING_CONFIG = {
  timeZoneOffset: "+09:00",
  timeZone: "Asia/Seoul",
  /** 가게 마감 몇 분 전까지 예약을 받는지. DB 함수 reservation_deadline과 같아야 한다. */
  reservationCutoffMinutes: 30,
  /** 영업일이 바뀌는 시각. 이보다 이른 마감은 다음 날 새벽으로 본다. DB 함수·제약과 같아야 한다. */
  businessDayStartHour: 6,
  freshnessDiscount: { fresh: 0, sell_today: 8, discard_tomorrow: 15 } satisfies Record<Freshness, number>,
  deadline: {
    urgentHours: 2,
    urgentDiscount: 12,
    soonHours: 4,
    soonDiscount: 5,
  },
  demand: {
    /** 최근 확정 수량의 집계 구간은 DB 함수 recent_approved_quantities와 같아야 한다. */
    idleAfterMinutes: 60,
    idleDiscount: 5,
    busyQuantity: 2,
    busyDiscount: -3,
  },
  maxDiscount: 100,
} as const;
