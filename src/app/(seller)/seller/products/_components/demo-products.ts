// UI 미리보기 전용 모델. API Product 계약이나 실제 상품을 나타내지 않습니다.
export type DemoProduct = {
  id: string;
  name: string;
  priceLabel: string;
  regularPriceLabel: string;
  minimumPriceLabel: string;
  quantityLabel: string;
  unitLabel: string;
  deadlineLabel: string;
  status: "판매 중" | "마감 임박" | "품절";
  illustration: boolean;
};

// 상태와 가격은 고정 시안입니다. 시간·재고·할인 판정 로직이 없습니다.
export const demoProducts: readonly DemoProduct[] = [
  { id: "demo-apple", name: "달콤한 사과 한 봉지", priceLabel: "4,500원", regularPriceLabel: "6,000원", minimumPriceLabel: "4,000원", quantityLabel: "8", unitLabel: "봉지", deadlineLabel: "예시 · 오늘 19:00", status: "판매 중", illustration: true },
  { id: "demo-tomato", name: "완숙 토마토", priceLabel: "3,000원", regularPriceLabel: "4,000원", minimumPriceLabel: "2,500원", quantityLabel: "3", unitLabel: "팩", deadlineLabel: "예시 · 오늘 18:30", status: "마감 임박", illustration: false },
  { id: "demo-greens", name: "아삭한 샐러드 채소", priceLabel: "2,500원", regularPriceLabel: "3,500원", minimumPriceLabel: "2,000원", quantityLabel: "0", unitLabel: "팩", deadlineLabel: "예시 · 오늘 19:00", status: "품절", illustration: false },
];
