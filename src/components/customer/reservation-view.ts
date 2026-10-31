import { PRICING_CONFIG } from "@/src/lib/pricing/config";
import type { Reservation, ReservationStatus } from "@/src/types/api";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "승인 대기",
  approved: "예약 승인",
  rejected: "예약 거절",
  cancelled: "예약 취소",
  completed: "판매 완료",
  expired: "기한 만료",
  no_show: "미방문",
};

const EXPLANATIONS: Record<ReservationStatus, string> = {
  pending: "판매자 확인 후 예약이 확정돼요.",
  approved: "선택한 시간에 방문해 현장에서 결제해 주세요.",
  rejected: "판매자가 요청을 승인하지 않았어요.",
  cancelled: "취소된 예약이에요.",
  completed: "매장에서 결제와 수령을 마쳤어요.",
  expired: "픽업 시각까지 승인되지 않아 예약이 만료되었어요.",
  no_show: "픽업 시각에 방문하지 않아 예약이 종료되었어요.",
};

const pickup = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PRICING_CONFIG.timeZone,
});

export type ReservationView = {
  id: string;
  name: string;
  status: string;
  explanation: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  pickup: string;
  store: string;
  address: string;
  canCancel: boolean;
};

export function toReservationView(reservation: Reservation): ReservationView {
  const cancelledBySeller = reservation.status === "cancelled" && reservation.cancelledBy === "seller";
  return {
    id: reservation.id,
    name: reservation.productName,
    status: STATUS_LABELS[reservation.status],
    explanation: cancelledBySeller ? "판매자가 예약을 취소했어요." : EXPLANATIONS[reservation.status],
    quantity: reservation.quantity,
    unit: reservation.unit,
    unitPrice: reservation.confirmedUnitPrice,
    total: reservation.totalPrice,
    pickup: pickup.format(new Date(reservation.pickupAt)),
    store: reservation.store.name,
    address: reservation.store.address,
    canCancel: reservation.status === "pending" || reservation.status === "approved",
  };
}
