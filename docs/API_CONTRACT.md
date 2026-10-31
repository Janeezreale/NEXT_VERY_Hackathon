# API 계약 초안

[시작 안내](../README.md) · 근거: [기획 원문](../plan.md) §4–5, §7–8

**상태: 총괄 검토 전 구조 제안.** 경로·영문 필드·오류 코드는 기획 원문에 없는 제안이며 API는 아직 구현되지 않았습니다. L01에서 [미정 정책](DECISIONS.md)을 정리하고, L03에서 공유 타입·Zod 스키마와 함께 계약을 확정한 뒤 UI를 연결합니다.

## 공통 형식 제안

- 성공 응답: `data`에 결과를 담습니다. 목록은 `data.items`와 `data.nextCursor`를 사용하며 마지막 커서는 null입니다.
- 오류 응답: `error.code`, `error.message`, 선택적 `error.fieldErrors`를 사용합니다. 오류 시 성공 데이터를 반환하지 않습니다.
- ID는 UUID 문자열, 금액은 원 단위 정수, 시간은 시간대가 포함된 ISO 8601 문자열로 전달합니다. 사용자 표시 시간대는 D02에서 확정합니다.
- 신선도는 `fresh`(싱싱), `sell_today`(오늘 안에 판매 권장), `discard_tomorrow`(내일 폐기 예정)로 제안합니다.
- 예약 상태는 `pending`, `approved`, `rejected`, `cancelled`, `completed`로 제안합니다.
- 인증 정보에서 사용자 ID·역할·매장 소유권을 서버가 확인합니다. 클라이언트가 보낸 사용자 ID나 역할을 권한 근거로 신뢰하지 않습니다.
- 예약 생성은 클라이언트가 가격을 정하지 않습니다. 서버가 수량·시각·재고·가격을 다시 검증합니다.

## 공유 응답 모델 제안

| 모델 | 주요 필드 | 의미 |
| --- | --- | --- |
| Product | id, storeId, name, category, unit, availableQuantity, basePrice, minPrice, currentPrice, discountRate, freshness, saleEndsAt, imageUrls, pricedAt | 화면에 표시할 현재 상품. 금액·할인율은 서버 제공 |
| Store | id, name, businessType, regionCode, address, closingTime, pickupWindow | 매장 정보. 픽업 범위의 상세 형식은 D02에서 확정 |
| Analysis | name, estimatedQuantity, unit, freshness, needsConfirmation, uncertaintyReason | AI 제안. 게시 전 판매자 확인 필수 |
| Reservation | id, productId, quantity, confirmedUnitPrice, totalPrice, pickupAt, status, createdAt, store | 예약 요청 때 확정한 단가·총액. 이후 현재가와 독립 |
| Report | period, registeredProducts, requestedReservations, approvedReservations, completedSales, soldQuantity, revenue, remainingQuantity, series | 집계 기준·기간·단위는 D07에서 확정 |

필수·선택·nullable 여부, 문자열 길이, 페이지 제한, 업종·지역 코드 목록, 구체적인 중첩 구조는 L03에서 공유 타입과 함께 확정합니다. 이 표만으로 서로 다른 응답 타입을 독립 구현하지 않습니다.

## 화면별 엔드포인트 제안

| 작업 | 메서드·경로 | 입력 | 성공 결과 | 권한 |
| --- | --- | --- | --- | --- |
| 현재 사용자 | GET `/api/me` | 없음 | 사용자 ID·역할·지역·매장 등록 여부 | 로그인 |
| 매장 조회·초기 등록 | GET / POST `/api/seller/store` | POST: 매장명·업종·지역·주소·마감·픽업 범위 | Store | 판매자 본인, D01·D02 확정 필요 |
| 이미지 업로드 | POST `/api/seller/images` | 이미지 파일 | 서버가 검증한 imagePath | 판매자, 형식·크기·소유권은 D05 |
| 이미지 분석 | POST `/api/seller/analyses` | imagePath, businessType, closingAt | Analysis | 이미지 소유 판매자 |
| 상품 게시 | POST `/api/seller/products` | name, category, quantity, unit, basePrice, minPrice, freshness, saleEndsAt, imagePaths, sellerConfirmed | Product | 본인 매장 판매자 |
| 판매자 상품 조회 | GET `/api/seller/products` | cursor, limit | Product 목록 | 본인 매장 |
| 재고·상품 수정 | PATCH `/api/seller/products/:id` | 변경 필드, 동시 수정 검증 정보 | Product | 본인 매장, D08 확정 후 |
| 지역 상품 탐색 | GET `/api/products` | region, category?, businessType?, cursor?, limit? | 판매 중 Product 목록 | 비로그인 허용 여부 D01 |
| 상품 상세 | GET `/api/products/:id` | 경로 ID | Product, Store | 조회 권한 D01 |
| 예약 생성 | POST `/api/reservations` | productId, quantity, pickupAt, 요청 중복 방지 키 | Reservation | 소비자 본인 |
| 내 예약 | GET `/api/me/reservations` | status?, cursor?, limit? | Reservation 목록 | 소비자 본인 |
| 내 예약 취소 | POST `/api/reservations/:id/cancel` | 경로 ID | Reservation | 소비자 본인, D03 |
| 판매자 예약 조회 | GET `/api/seller/reservations` | status?, cursor?, limit? | Reservation 목록 | 본인 매장 |
| 예약 승인·거절 | POST `/api/seller/reservations/:id/approve` 또는 `/reject` | 경로 ID | Reservation | 본인 매장 |
| 판매 완료 | POST `/api/seller/reservations/:id/complete` | 경로 ID | Reservation, saleId | 본인 매장 |
| 판매 리포트 | GET `/api/seller/reports` | from, to | Report | 본인 매장 |

회원가입·로그인·로그아웃은 Supabase Auth를 사용합니다. C는 UI를 맡고 총괄이 인증 호출·세션·역할 부여 방식을 확정합니다. 독자적인 비밀번호 저장 API는 만들지 않습니다.

## 오류와 화면 처리 제안

| HTTP | 코드 | 화면 처리 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 해당 입력 옆에 수정 안내 |
| 401 | UNAUTHENTICATED | 로그인 안내 |
| 403 | FORBIDDEN | 권한 없음, 다른 사용자 데이터 표시 금지 |
| 404 | NOT_FOUND | 상품·예약을 찾을 수 없음 |
| 409 | OUT_OF_STOCK | 남은 수량을 다시 조회하고 선택 수정 |
| 409 | SALE_ENDED / INVALID_TRANSITION | 종료 또는 상태 변경 안내·새로 조회 |
| 409 | PRICE_CHANGED | 재확인 정책을 채택할 경우에만 사용, D04 |
| 413 / 415 | IMAGE_TOO_LARGE / UNSUPPORTED_IMAGE | 다른 이미지 선택 |
| 422 | AI_RESULT_INVALID | 분석 결과 검증 실패 안내, 다시 분석 |
| 502 / 503 | AI_UNAVAILABLE | 실패 안내와 재시도 제공 |
| 500 | INTERNAL_ERROR | 일반 오류 표시, 내부 키·스택 노출 금지 |

네트워크 시간 초과는 성공·실패가 불명확할 수 있습니다. 예약·판매 완료의 재시도는 D06의 중복 방지 계약을 사용하며 프론트엔드 버튼 비활성화만으로 해결하지 않습니다.
