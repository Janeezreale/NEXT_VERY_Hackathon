# B02·B03 소비자 화면 인수인계

## 데이터 출처

| 화면 | 데이터 |
| --- | --- |
| `/shop` 상품 목록 | 실제 상품. 서버 계산 가격, 지역 필수, 최대 50개 |
| `/shop` 매장 지도 | 실제 매장 |
| `/shop/products/[id]` | 실제 상품과 매장. 품절·판매 종료 표시 |
| `/shop/products/[id]/reserve` | 실제 상품. 예약 요청은 전송되지 않음(L05 대기) |
| `/shop/reservations` | `preview-data.ts`의 데모. 상단에 데모 안내 표시 |

## 규칙

- 가격·할인율은 서버 값을 표시하고 화면에서 계산하지 않습니다.
- API 응답은 `product-view.ts`에서 화면 값으로 바꿉니다. 시각은 한국 시간입니다.
- `preview-data.ts`는 예약 내역 전용입니다. API 오류 대체 데이터로 쓰지 않습니다.
- `_preview`는 `/shop/reservations`에만 남아 있습니다.

## 다음 작업

예약 API(L05)가 완성되면 `reserve-preview.tsx`의 `previewRequest`와 `reservations-preview.tsx`의 데모 데이터를 교체합니다. 방문 시각 간격도 이때 확정합니다.
