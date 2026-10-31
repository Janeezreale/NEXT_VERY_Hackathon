# 데이터 모델과 권한

[시작 안내](../README.md) · 근거: [기획 원문](../plan.md) §5, §7

테이블 이름과 업무 규칙은 기획 기준입니다. 아래 영문 컬럼명과 관계 세부사항은 **설계 제안**입니다. 총괄만 스키마·RLS·트랜잭션을 확정하고 구현합니다.

[schema.sql](../supabase/schema.sql)이 테이블·제약·인덱스·RLS를 구현합니다(2026-10-31, 사용자가 원격 프로젝트에 적용). 빈 프로젝트 배포에는 이 파일을 한 번 실행합니다. 스키마를 변경하면 이 파일을 갱신하고, 이미 적용된 프로젝트에는 변경분 SQL을 따로 실행합니다(`supabase/migrations/`). 역할은 가입 메타데이터 `role`이 `seller`이면 사장님, 그 외에는 고객으로 저장합니다. 사장님의 가게 위치(`address`, `region_code`)와 마감 시각(`closing_time`)은 stores에 저장합니다. [확정 정책](DECISIONS.md#확정-기록)을 반영했습니다: 판매자당 매장 1개, 비로그인은 매장·상품·이미지 조회만 가능(`stores.owner_id` 제외), 금액 1원 이상, 예약 `idempotency_key`의 소비자별 유일성. 가입 후 역할 변경과 상품 수정·삭제는 차단 상태입니다. 예약·판매 쓰기 함수(L05)와 Storage 버킷·정책(D05)은 아직 없습니다.

| 테이블 | 컬럼 제안 | 관계·검증 |
| --- | --- | --- |
| profiles | id, role, region_code | id는 Auth 사용자 연결. 역할 변경 권한 통제 |
| stores | id, owner_id, name, region_code, address, opening_time, closing_time, latitude, longitude | 실제 판매자 소유, 판매자당 1개. 좌표는 nullable이고 둘 다 있거나 둘 다 없음. 업종 컬럼 없음(D10). 운영 시간 모델은 D02·D16 |
| products | id, store_id, name, unit, available_quantity, base_price, min_price, freshness, sale_ends_at, created_at | 실제 매장 FK. 수량 음수 금지, 최저가 ≤ 기준가 |
| product_images | id, product_id, storage_path | 실제 상품 연결. 파일 접근·소유권 검증 |
| reservations | id, product_id, consumer_id, quantity, confirmed_unit_price, total_price, pickup_at, status, approved_at, created_at, idempotency_key, cancelled_by, contact_name, contact_phone | 수량 양수, 요청 시 가격 저장. approved_at은 확정 시각이며 최근 수요 계산에 필요 |
| sales | id, reservation_id, final_amount, completed_at | 예약당 판매 기록 한 번. 리포트 기준 |

수량은 양의 정수, 금액은 1원 이상입니다(D08). 단위별 집계 방식은 D07에서 확정합니다. 상품별 예약·판매 수량은 예약과 판매 기록으로 추적하고 기존 데이터 변경·삭제 정책도 총괄이 정합니다.

## 예약 상태와 재고

| 동작 | 상태 전환 | 재고 영향 |
| --- | --- | --- |
| 예약 | 새 예약 → approved | 수량 확보: 판매 가능 수량 감소. 판매자 승인 없이 즉시 확정(D15) |
| 취소 | approved → cancelled | 소비자 본인 또는 판매자. `cancelled_by` 기록, 확보 수량 한 번 반환(D03) |
| 노쇼 | approved → no_show | 픽업 시각 이후 판매자 처리. 확보 수량 한 번 반환. 수요에서 제외 |
| 현장 결제·수령 완료 | approved → completed | 추가 차감 없음. sales 한 번 기록 |

취소·완료·노쇼는 종료 상태입니다. enum의 `pending`은 쓰지 않고 `rejected`·`expired`는 승인 제도가 있던 때의 이력입니다. 예약 생성은 확정 가격을 인자로 받으므로 `create_reservation`은 서버 전용 키로만 호출합니다. 상태 변경 `change_reservation_status`는 사용자 권한으로 호출하고 함수가 소유권을 확인합니다. 잠금 순서는 products → reservations입니다.

재고 확인·확보·예약 생성은 같은 DB 트랜잭션에서 처리합니다. 상태 변경·재고 반환, 판매 완료·판매 기록 생성도 각각 원자적으로 처리합니다. 두 요청이 마지막 한 개를 동시에 예약해도 하나만 성공해야 합니다. 중복 요청과 취소·완료 경합은 서버/DB에서 제어합니다.

## 접근 권한 기준

| 대상 | 소비자 | 판매자 | 구현 검토 사항 |
| --- | --- | --- | --- |
| profiles | 본인 정보 | 본인 정보 | 역할을 임의 승격하지 못하게 제한 |
| stores / products | 판매용 공개 정보 조회 | 본인 매장·상품 관리 | 비공개 컬럼·종료 상품 노출 범위 확정 |
| product_images / Storage | 허용된 상품 이미지 읽기 | 본인 이미지 업로드·관리 | 경로만 바꿔 타인 파일 사용 불가 |
| reservations | 본인 예약 조회·허용된 취소 | 본인 매장 예약 조회·상태 변경 | 다른 소비자·매장 접근 금지. `contact_*`는 직접 조회 불가, 판매자는 함수로 진행 중 예약만 조회 |
| sales | 소비자 직접 접근은 별도 요구 없음 | 본인 매장 리포트 조회 | 임의 매출 생성·수정 금지 |

이 표는 권한 요구사항이며 직접 테이블 쓰기를 허용한다는 뜻이 아닙니다. 재고·예약·판매 변경은 정해진 서버 처리와 트랜잭션을 거칩니다. RLS뿐 아니라 서버 API에서도 사용자·역할·소유권을 확인하고 Storage 정책도 별도로 검증합니다.
