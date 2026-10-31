import { demoRequests, type DemoRequest } from "../../dashboard/_components/demo-requests";

// UI 전용 표시 모델입니다. 서버 예약 계약·재고 처리 모델이 아닙니다.
export const reservationStatuses = ["승인 대기", "예약 승인", "예약 거절", "예약 취소", "판매 완료"] as const;
export type DemoReservationStatus = typeof reservationStatuses[number];
export type DemoReservation = Omit<DemoRequest, "statusLabel"> & { statusLabel: DemoReservationStatus };
export type DemoReservationAction = "예약 승인" | "예약 거절" | "판매 완료";

export const demoReservations: readonly DemoReservation[] = [
  ...demoRequests.map((request): DemoReservation => ({ ...request, statusLabel: request.statusLabel === "픽업 대기" ? "예약 승인" : "승인 대기" })),
  { id: "DEMO-104", productName: "완숙 토마토", quantityLabel: "2팩", priceLabel: "6,000원", pickupLabel: "10월 31일 16:00 · 한국 시간", statusLabel: "판매 완료" },
  { id: "DEMO-105", productName: "아삭한 샐러드 채소", quantityLabel: "1팩", priceLabel: "2,500원", pickupLabel: "10월 31일 17:00 · 한국 시간", statusLabel: "예약 거절" },
  { id: "DEMO-106", productName: "완숙 토마토", quantityLabel: "1팩", priceLabel: "3,000원", pickupLabel: "10월 31일 17:30 · 한국 시간", statusLabel: "예약 취소" },
];
