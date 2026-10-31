import { toReservationView, type ReservationView } from "@/src/components/customer/reservation-view";
import type { Reservation, ReservationStatus } from "@/src/types/api";

export type SellerAction = "approve" | "reject" | "complete" | "cancel" | "no-show";

export type SellerReservationView = ReservationView & { actions: SellerAction[]; contact: Reservation["contact"] };

export const ACTION_LABELS: Record<SellerAction, string> = {
  approve: "승인",
  reject: "거절",
  complete: "판매 완료",
  cancel: "예약 취소",
  "no-show": "노쇼 처리",
};

/** 화면에서 고를 수 있는 처리. 최종 권한과 상태는 DB 함수가 다시 확인한다. */
export function sellerActions(status: ReservationStatus, pickupPassed: boolean): SellerAction[] {
  if (status === "pending") return ["approve", "reject"];
  if (status === "approved") return pickupPassed ? ["complete", "no-show", "cancel"] : ["complete", "cancel"];
  return [];
}

export function toSellerReservationView(reservation: Reservation, now: Date): SellerReservationView {
  return {
    ...toReservationView(reservation),
    actions: sellerActions(reservation.status, new Date(reservation.pickupAt) <= now),
    contact: reservation.contact,
  };
}
