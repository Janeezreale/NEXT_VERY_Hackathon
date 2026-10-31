# B02·B03 소비자 UI 보완 인수인계

## 범위

이번 변경은 `src/app/(customer)/shop/`와 `src/components/customer/` 내부에 한정합니다.
API·DB·인증·가격 정책·재고 확보·실제 예약·취소는 구현하지 않았습니다.
`preview-data.ts`는 개발용 Mock입니다. 사용자 요청으로 배포 화면에도 표시하며(2026-10-31), 모든 화면 상단에 데모 데이터 안내를 표시합니다. API 오류 대체 데이터로 사용하지 않습니다.
일반 화면에는 개발용 선택 도구를 노출하지 않습니다.

## 확인 URL

기존 개발 서버 기준 `http://localhost:3100` 뒤에 다음 경로를 붙입니다.

- `/shop`: 지역 미선택 안내.
- `/shop?region=성북구&category=채소`: 선택한 조건으로 목록 조회.
- 위 목록의 상세 링크 → 상세의 뒤로: URL에 저장된 지역·품목 복원.
- `/shop?region=성북구&_preview=loading`: 목록 로딩.
- `/shop?region=성북구&_preview=error`: 목록 오류. 다시 시도하면 같은 조건의 개발용 목록으로 복귀.
- `/shop?region=마포구`: 빈 목록. 초기화해도 선택 지역은 유지.
- `/shop/products/preview-1?_preview=soldout`: 품절.
- `/shop/products/preview-1?_preview=ended`: 판매 종료.
- `/shop/products/preview-1?_preview=unavailable`: 재고 확인 불가.
- `/shop/products/preview-1?_preview=loading`: 상세 로딩.
- `/shop/products/preview-1?_preview=error`: 상세 오류·재시도.
- `/shop/products/preview-1?_preview=missing`: 상품 없음.
- `/shop/products/preview-1?_preview=long`: 긴 상품명.
- `/shop/products/preview-1?_preview=photo`: 이미지 로딩 실패 확인용 URL.
- `/shop/products/preview-1/reserve`: 수량·시간 선택과 확인. 요청 상태 확인은 미연결 안내로 끝나며 예약을 만들지 않음.
- 예약 URL에 `?_preview=failure`, `?_preview=unknown`, `?_preview=pending`: 확인 단계에서 버튼을 눌러 실패·결과 불명·대기 UI 확인.
- `/shop/reservations`: 기존 5개 상태와 전체·진행 중·진행 완료 필터, 상세 펼치기.
- `/shop/reservations?_preview=empty`: 전체 내역 없음.
- `/shop/reservations?_preview=active-only`: 진행 완료 필터 선택 시 필터 결과 없음.
- `/shop/reservations?_preview=loading`, `?_preview=error`: 내역 로딩·오류.

`_preview`는 개발 페이지에서만 사용하는 UI 시나리오입니다. 소비자 이동 링크와 필터 변경에는 전달하지 않습니다.
판매 가능 여부는 외부 prop으로 전달하며 재고·현재 시각으로 판단하지 않습니다.
요청 Mock은 기본적으로 미연결 결과만 제공하고 성공·승인 상태를 만들지 않습니다.
실패 재시도에서 수량·시간을 유지하며, 결과 불명에서는 재전송을 차단합니다. 실제 결과 조회는 총괄 계약이 필요합니다.
현재가와 예약 당시 확정 단가·총액은 별도로 표시합니다.

## 검증 결과와 남은 작업

- TypeScript 검사·프로덕션 빌드 통과.
- Vitest 15개 통과: URL 조건 왕복·허용되지 않은 조건 처리·개발 시나리오 제외·상태별 분류.
- lint: 오류 없음. 기존 postcss.config.mjs 경고 1개.
- 브라우저 도구가 URL을 확인하지 못해 Computer Use 중단. 320px·390px·넓은 화면·200% 확대·클릭·키보드·이미지 실패의 실제 브라우저 검증은 미실행.
- `(buyer)`와 실제 `(customer)/shop` 차이는 유지. C의 공통 UI·폰트·테마 연결은 미완료.
- D02 픽업·시간, D03 취소, D04 가격 변경, D06 결과 조회·중복 방지 정책과 실제 API 연동이 필요.
- B02·B03 UI 보완만 완료했으며 작업 카드의 실제 데이터 연동 완료를 뜻하지 않습니다.