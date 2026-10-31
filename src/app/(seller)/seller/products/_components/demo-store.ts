// 화면 전용 표시값. 실제 가게 설정이나 API 계약이 아닙니다.
// 향후 승인된 가게 설정을 연결할 때 운영 정보 영역에 별도로 전달합니다.
export const demoStore = {
  nameLabel: "데모 신선가게",
  addressLabel: "데모 주소 · 실제 매장 주소 미연동",
  businessHoursLabel: "09:00–19:30 (한국 시간)",
  reservationDeadlineLabel: "19:00 (한국 시간)",
  reservationPolicyDraftLabel: "영업 종료 30분 전 예약 접수 마감",
};

export type DemoStoreDisplay = typeof demoStore;
