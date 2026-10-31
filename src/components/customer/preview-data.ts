// Demo UI scenarios, labelled on screen by PreviewShell. These are not API types or real inventory.
export const previewProducts = [
  { id: "preview-1", name: "오늘의 제철 채소 꾸러미", store: "초록채소 가게", price: 5900, base: 10000, discount: 41, stock: 4, unit: "꾸러미", pickup: "18:00–20:00", end: "18:30", photo: "photo-1540420773420-3366772f4999", description: "다양한 채소를 한 번에 만나는 꾸러미예요. 구성과 상태는 방문 전 판매자에게 확인해 주세요.", address: "서울 성북구 예시로 12, 1층", slots: ["18:00", "18:30", "19:00"], region: "성북구" },
  { id: "preview-2", name: "달콤한 사과 한 봉지", store: "계절 과일상점", price: 6000, base: 8000, discount: 25, stock: 3, unit: "봉지", pickup: "17:00–19:00", end: "18:00", photo: "photo-1560806887-1e4cd0b6cbd6", description: "간식으로 나누기 좋은 사과 한 봉지예요. 사진은 참고용이며 실제 상품의 크기와 구성은 다를 수 있어요.", address: "서울 성북구 예시로 24, 1층", slots: ["17:00", "17:30", "18:00"], region: "성북구" },
  { id: "preview-3", name: "작은 꽃다발로 전하는 마음", store: "골목 꽃집", price: 9000, base: 15000, discount: 40, stock: 2, unit: "다발", pickup: "17:30–20:00", end: "19:00", photo: "photo-1563241527-3004b7be0ffd", description: "일상에 작은 색을 더하는 꽃다발이에요. 꽃의 종류와 포장 구성은 판매자 확인이 필요해요.", address: "서울 성북구 예시길 8, 1층", slots: ["17:30", "18:00", "18:30"], region: "성북구" },
] as const;
export type PreviewProduct = Omit<(typeof previewProducts)[number], "name" | "photo"> & { name: string; photo: string };
export const money = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";
export const previewStatuses = ["승인 대기", "예약 승인", "예약 거절", "예약 취소", "판매 완료"] as const;
export type PreviewStatus = (typeof previewStatuses)[number];
export type PreviewReservation = (typeof previewReservations)[number];
// Isolated transport simulation; never called as an API failure fallback.
export async function previewRequest(outcome: import("./preview-state").RequestOutcome) {
  await new Promise<void>(resolve => setTimeout(resolve, 650));
  return outcome;
}
// Pre-authored snapshots, deliberately independent from the current-price display.
export const previewReservations = previewStatuses.map((status, index) => ({
  id: `DEMO-00${index + 1}`, product: previewProducts[index % 3], status,
  quantity: 1, confirmedUnitPrice: [5500, 5800, 8500, 5500, 5800][index],
  total: [5500, 5800, 8500, 5500, 5800][index], pickup: "11월 1일 18:00",
}));
