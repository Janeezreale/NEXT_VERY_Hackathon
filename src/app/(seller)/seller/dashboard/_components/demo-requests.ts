// 격리된 UI 데모 전용. 실제 예약·고객 정보나 API 응답 모델이 아닙니다.
export type DemoRequest = {
  id: string;
  productName: string;
  quantityLabel: string;
  priceLabel: string;
  pickupLabel: string;
  statusLabel: "승인 대기" | "픽업 대기";
};

export const demoRequests: readonly DemoRequest[] = [
  { id: "DEMO-101", productName: "달콤한 사과 한 봉지", quantityLabel: "2봉지", priceLabel: "9,000원", pickupLabel: "10월 31일 18:00 · 한국 시간", statusLabel: "승인 대기" },
  { id: "DEMO-102", productName: "완숙 토마토", quantityLabel: "1팩", priceLabel: "3,000원", pickupLabel: "10월 31일 18:30 · 한국 시간", statusLabel: "승인 대기" },
  { id: "DEMO-103", productName: "달콤한 사과 한 봉지", quantityLabel: "1봉지", priceLabel: "4,500원", pickupLabel: "10월 31일 18:00 · 한국 시간", statusLabel: "픽업 대기" },
];
