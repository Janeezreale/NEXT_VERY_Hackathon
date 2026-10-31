// UI 데모 전용 예시입니다. 실제 집계 계약·판매 데이터가 아닙니다.
export const demoDailySales = [
  { date: "10/25", revenue: 12000, completed: 2 },
  { date: "10/26", revenue: 18500, completed: 3 },
  { date: "10/27", revenue: 9000, completed: 2 },
  { date: "10/28", revenue: 22000, completed: 4 },
  { date: "10/29", revenue: 16000, completed: 3 },
  { date: "10/30", revenue: 27500, completed: 5 },
  { date: "10/31", revenue: 15000, completed: 3 },
];
export type DemoPeriod = "day" | "week";
export const demoReportSnapshots = {
  day: { periodLabel: "2026.10.31 · 한국 시간", registered: 3, requested: 6, approved: 1, soldQuantityLabels: ["2봉지", "2팩", "0팩"] },
  week: { periodLabel: "2026.10.25–10.31 · 한국 시간", registered: 14, requested: 31, approved: 4, soldQuantityLabels: ["16봉지", "10팩", "6팩"] },
};
export const formatWon = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
