# 공통 UI 디자인 가이드 — Fresh & Clean

> 디자인 방향 확정: A안(Fresh & Clean) · 기준일: 2026-10-31  
> 적용 대상: 신선식품 마감 할인 B2B2C 플랫폼의 소비자·판매자·로그인·리포트 UI  
> 이 문서는 디자인 기준과 향후 구현 가이드다. 코드 적용이나 기능·업무 정책의 확정을 의미하지 않는다.

## 0. 확인한 프로젝트 현황과 적용 우선순위

### 확인 결과

현재 작업 루트에서 숨김 파일을 포함해 확인했다. `.git` 내부는 제품 소스 조사 대상에서 제외했다.

| 확인 대상 | 결과 | 문서에 미치는 영향 |
| --- | --- | --- |
| `PRD.md` | 없음 | 예약·결제·재고 차감·승인 정책, 화면 경로를 임의로 정의하지 않는다. |
| `package.json`, lockfile, 앱 설정 | 없음 | React/Next.js/Vite 및 라이브러리 버전은 확인되지 않았다. |
| Tailwind 설정, 전역 스타일 파일, `components.json` | 없음 | Tailwind/shadcn 설치를 전제하지 않고 버전별 적용 예시만 제공한다. |
| 실제 앱 공통 컴포넌트 | 없음 | 기존 컴포넌트 경로·props·variant를 추정하지 않는다. |
| `design-preview/index.html` | 있음 | HTML/CSS/JavaScript 기반 비교용 프로토타입. A안의 밝은 화면·그린·둥근 상품 카드를 참고했다. |
| 기존 `DESIGN.md` | 없음 | 신규 작성. 다른 파일은 변경하지 않는다. |

비교 시안에는 임시 명칭 `오늘한입`, 임시 로고 모양, 샘플 상품·매장·거리·가격이 들어 있다. 서비스명은 **라스트픽(LastPick)** 으로 확정했다(D14). 로고는 미정이다.

### 충돌 처리

1. 팀이 확정한 이번 A안과 지정 색상·Pretendard를 시각적 기준으로 삼는다.
2. 비교 HTML의 이전 색상(`#18834C`, `#EDF5E9`), Arial 우선 폰트, 650px/900px 분기와 작은 글자·버튼 크기는 확정 토큰이 아니다. 이 문서의 기준으로 향후 적용하되 이번 작업에서는 비교 HTML을 수정하지 않는다.
3. 추후 실제 앱을 연결하면 `PRD.md`의 업무 정책, 설치 버전 및 기존 컴포넌트 API를 먼저 확인한다. 디자인 문서가 업무 상태 전이나 권한을 덮어쓰지 않는다.
4. 아래 보조 색상·크기·상태 표현은 확정 컨셉을 구현하기 위한 공통 UI 기준이다. 기존 팀 규칙과 충돌하면 차이를 기록하고 담당자와 조정한다. 기능을 새로 추가하는 근거로 사용하지 않는다.
5. 라이트 테마를 기준으로 한다. OS 다크 모드에 따라 자동 반전하지 않으며, 다크 테마는 별도의 대비 검토가 필요하다.

## 1. 브랜드 컨셉과 UX 원칙

**Fresh & Clean:** 신선한 상품을 믿고 선택하고, 할인 혜택과 픽업 조건을 빠르게 이해할 수 있는 모바일 퍼스트 디자인.

- **정보가 먼저:** 상품명 → 판매 가격·할인율 → 남은 수량 → 예약 마감·픽업 시간 → 주요 행동 순으로 읽힌다. 소비자에게 중요한 조건을 장식보다 먼저 배치한다.
- **화이트 기반의 신뢰감:** 페이지 배경은 아주 옅은 그린, 카드·폼·헤더는 화이트. 그린은 브랜드와 주요 행동, 오렌지는 주의가 필요한 혜택·시간 정보에 제한한다.
- **하나의 분명한 주요 행동:** 각 작업 영역에서 강조 CTA는 하나를 우선한다. `확인`보다 `예약 요청하기`, `상품 등록하기`처럼 결과가 보이는 문구를 쓴다.
- **상태를 정직하게:** 재고, 픽업, 결제 상태를 하나의 초록색 `완료`로 뭉뚱그리지 않는다.
- **양쪽 사용자에게 같은 언어:** 판매자와 소비자는 같은 서버 상태를 역할에 맞게 설명한다. 색상·아이콘 의미는 공통이다.
- **실제 정보만 강조:** 확인되지 않은 신선도·유통기한·거리·판매량·환경 기여 수치를 생성하지 않는다. 상품 사진은 실제 상품을 대표해야 한다.
- **친절하고 간결한 한국어:** `예약이 확정됐어요. 선택한 시간에 방문해 주세요.`처럼 현재 상태와 다음 행동을 설명한다. 실패를 사용자의 잘못으로 표현하지 않는다.

## 2. 컬러 토큰과 사용 규칙

토큰은 **원시값 → 의미 → 컴포넌트** 순서로 연결한다. 예: `green-action → primary → Button/default`. 화면마다 임의의 초록색을 추가하지 않는다.

### 확정 브랜드 팔레트

| 토큰 | 값 | 사용 |
| --- | --- | --- |
| `brand` | `#248A60` | Primary Green. 브랜드 장식, 아이콘, 충분히 큰 강조 텍스트. 일반 작은 글자 색이나 흰색 작은 글자의 버튼 배경으로 그대로 쓰지 않는다. |
| `secondary` | `#EAF6EF` | Light Green. 선택 영역·보조 버튼·성공 배지의 배경. 텍스트는 `secondary-foreground`. |
| `highlight` | `#F59E0B` | Accent Orange. 제한된 강조 배경·차트 강조·주의 아이콘. 흰색 글자를 올리지 않는다. |
| `background` | `#F8FAF8` | 전체 페이지 배경. |
| `foreground` | `#1F2937` | 기본 본문·제목·가격. |
| `font-sans` | Pretendard + 시스템 폴백 | 모든 화면의 공통 글꼴. |

### 의미별 보조 토큰

| 토큰 | 값 | 사용 |
| --- | --- | --- |
| `card`, `popover`, `surface` | `#FFFFFF` | 카드·헤더·폼·다이얼로그 표면 |
| `primary` | `#1F7A54` | 접근성을 위한 그린 파생색. 14–16px 흰색 텍스트를 사용하는 주요 버튼 |
| `primary-foreground` | `#FFFFFF` | 주요 버튼 글자 |
| `primary-hover` | `#196545` | 주요 버튼 hover |
| `primary-active` | `#145238` | 주요 버튼 pressed |
| `secondary-foreground`, `link` | `#176B49` | 연두 배경의 텍스트·작은 그린 링크·할인율 |
| `muted` | `#F1F5F2` | 보조 영역·비활성 배경·스켈레톤 |
| `muted-foreground` | `#626B77` | 화이트·페이지 배경 위 설명·보조 정보·정가 |
| `border` | `#E2E8E3` | 카드·섹션의 장식적 구분선 |
| `input` | `#64748B` | 입력 컨트롤 외곽선. 옅은 장식용 border로 대체하지 않는다. |
| `ring` | `#176B49` | 키보드 포커스. 바깥 2px 링 + 표면색 2px 간격 |
| `highlight-foreground` | `#1F2937` | 오렌지 배경의 텍스트 |
| `success` / `success-bg` | `#176B49` / `#EAF6EF` | 승인·성공·픽업 가능 |
| `warning` / `warning-bg` | `#B45309` / `#FFFBEB` | 대기·마감 임박·수량 확인 필요 |
| `destructive` / `danger-bg` | `#B91C1C` / `#FEF2F2` | 오류·거절·파괴적 행동 |
| `destructive-foreground` | `#FFFFFF` | 채워진 위험 버튼의 텍스트 |
| `info` / `info-bg` | `#1D4ED8` / `#EFF6FF` | 중립적 안내·데이터 갱신 안내 |

**브랜드 그린과 접근성 그린의 관계:** 확정된 `#248A60`은 변경하지 않는다. 흰색과의 대비는 약 **4.30:1**이므로 일반 텍스트 AA 기준 4.5:1에 못 미친다. `primary` 파생색을 버튼에 쓰고, 원래 브랜드색은 브랜드 표현에 유지한다. 작은 할인율·링크에는 `link`를 사용한다.

**오렌지 사용:** `#F59E0B`와 흰색의 대비는 약 **2.15:1**, `#1F2937`과는 약 **6.83:1**이다. 오렌지 위에는 진한 텍스트를 사용한다. 흰 화면의 작은 경고 문구는 오렌지 원색 대신 `warning`을 사용한다. 모든 할인을 오렌지로 칠하지 않는다.

상태 배경 위에는 해당 상태의 전경색을 쓴다. 반투명 텍스트, 사진 위 텍스트, hover 색상은 실제 합성 배경에서 별도로 대비를 확인한다. 색상만으로 성공·오류·선택을 구분하지 않는다.

## 3. 타이포그래피

```css
font-family: "Pretendard Variable", "Pretendard", -apple-system,
  BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR",
  "Malgun Gothic", "Segoe UI", sans-serif;
```

Pretendard 로딩이 확인되기 전에는 설치되어 있다고 가정하지 않는다. 향후 팀의 폰트 공급 방식을 확인해 WOFF2 자산 또는 승인된 공급원을 사용한다. 자체 호스팅 시 라이선스를 포함하고 `font-display: swap`을 사용한다. 이 문서는 폰트 파일이나 CDN 의존성을 추가하지 않는다.

기준 루트 크기는 브라우저 기본값 100%(일반적으로 16px). 크기는 `rem`으로 구현하고 브라우저 확대를 막지 않는다.

| 용도 | 모바일 크기 / 줄높이 | 데스크톱 크기 / 줄높이 | 굵기 |
| --- | --- | --- | --- |
| 랜딩의 대표 제목 | 32 / 40px | 40 / 48px | 700 |
| 화면 제목 H1 | 24 / 32px | 32 / 40px | 700 |
| 섹션 제목 H2 | 20 / 28px | 24 / 32px | 700 |
| 카드 제목 H3 | 16 / 24px | 18 / 28px | 600 |
| 본문·입력값 | 16 / 24px | 16 / 24px | 400 |
| 버튼·폼 라벨 | 14 / 20px | 14 / 20px | 600 |
| 설명·테이블 | 14 / 20px | 14 / 20px | 400–500 |
| 배지·보조 캡션 | 12 / 18px | 12 / 18px | 500–600 |
| 카드 판매가 | 20 / 28px | 24 / 32px | 700 |
| 상세 판매가·대표 KPI | 28 / 36px | 32 / 40px | 700 |

- 12px 미만은 사용하지 않는다. 예약 조건·오류·픽업 시간 등 중요한 내용은 최소 14px.
- 본문 자간은 0, 제목은 최대 `-0.02em`. 긴 한국어 제목은 줄바꿈을 허용한다.
- 숫자 금액·시간·리포트에는 `font-variant-numeric: tabular-nums`를 적용한다.
- 상품명은 목록에서 2줄까지 표시할 수 있으나 상세 화면에서는 전체를 제공한다. 필수 조건과 오류 문구는 말줄임하지 않는다.
- 화면마다 H1 하나, 하위 섹션 H2, 카드 H3의 의미 구조를 유지한다. 크기를 위해 제목 단계를 건너뛰지 않는다.

## 4. 여백·레이아웃·반응형

### 공간과 형태

| 항목 | 기준 |
| --- | --- |
| 간격 스케일 | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px |
| 아이콘–라벨 / 라벨–입력 | 8px |
| 입력–도움말 | 4–8px |
| 폼 필드 간격 | 20–24px |
| 카드 내부 여백 | 모바일 16px, 넓은 화면 24px |
| 카드 간격 | 모바일 12–16px, 데스크톱 24px |
| 섹션 간격 | 모바일 32px, 데스크톱 48px |
| 반경 | 배지 6px, 입력·버튼 8px, 카드 12px, 다이얼로그 16px, 필터 칩 9999px |
| 카드 그림자 | `0 2px 8px rgb(31 41 55 / 0.04)`; 기본은 border 중심 |
| 오버레이 그림자 | `0 12px 32px rgb(31 41 55 / 0.12)` |
| 상태 전환 | 색·opacity 150ms, 패널 200ms. 반복 점멸 금지 |

### 기본 브레이크포인트

기존 앱 설정이 없는 현재의 공통 기준이다. 향후 기존 설정을 발견하면 매핑 차이를 먼저 검토한다. 모바일 기본 스타일에 `min-width` 조건을 더한다.

| 구간 | CSS 기준 | 레이아웃 |
| --- | --- | --- |
| 기본 | 0–639px | 좌우 16px, 단일 작업 흐름. 320px 폭도 가로 스크롤 없이 지원 |
| `sm` | 640px / 40rem 이상 | 좌우 24px, 상품 카드 2열 |
| `md` | 768px / 48rem 이상 | 필터·폼의 관련 필드 2열 가능 |
| `lg` | 1024px / 64rem 이상 | 좌우 32px, 상품 3열, 판매자 사이드 내비게이션 가능 |
| `xl` | 1280px / 80rem 이상 | 최대 콘텐츠 폭 내에서 여백 확장 |
| `2xl` | 1536px / 96rem 이상 | 콘텐츠 폭을 계속 늘리지 않고 중앙 정렬 |

- 일반 콘텐츠 최대 폭 **1200px**, 긴 폼 **640px**, 로그인 **400px**. 폭은 `width: 100%`와 함께 제한한다.
- 기본 상품 목록은 1열, `sm`부터 2열, `lg`부터 3열. 390px에서도 정보 읽기가 우선이다. A안 시안의 작은 2열 카드를 강제로 유지하지 않는다.
- 데스크톱 카드·폼 순서와 모바일의 읽기 순서는 같아야 한다. 중요한 상태를 모바일에서 숨기지 않는다.
- 모바일 헤더 최소 높이 56px, 데스크톱 64px. 고정 하단 내비게이션은 64px + `env(safe-area-inset-bottom)`.
- 고정 CTA와 하단 내비게이션을 겹치지 않게 배치하고 본문 하단에 실제 고정 영역 높이만큼 여백을 확보한다. 키보드가 올라와도 입력값·오류·제출 버튼에 접근 가능해야 한다.
- 판매자 표는 작은 화면에서 행별 카드로 전환한다. 비교가 필요한 리포트 표만 라벨이 있는 가로 스크롤 영역을 허용한다.
- 레이어 기본값: 일반 0, sticky 20, 메뉴 30, 모달 배경 40, 모달 50, 토스트 60. 설치된 오버레이의 기존 레이어 체계를 우선 확인한다.

## 5. 공통 컴포넌트 규칙

### 버튼

| 유형 | 모습 | 예시 |
| --- | --- | --- |
| Primary | `primary` 배경 + 흰색, 굵기 600 | 예약 요청하기, 상품 등록하기, 저장하기 |
| Secondary | `secondary` 배경 + `secondary-foreground` | 필터 적용, 예약 내역 보기 |
| Outline | 화이트 + `input` 외곽선 + 기본 텍스트 | 뒤로, 취소 |
| Ghost/Link | 투명 + `link`, 텍스트 링크는 밑줄 | 자세히 보기 |
| Destructive | `destructive` 배경 + 흰색 | 승인된 업무 정책상 삭제·예약 취소 확정 |

- 기본 높이 48px, 좌우 16–20px. 밀도 높은 화면도 최소 높이 44px. 아이콘 전용 버튼은 최소 44×44px.
- hover는 색으로, pressed는 더 진한 색으로 표현한다. 그림자·크기 확대에 의존하지 않는다.
- disabled는 `muted` 배경·`muted-foreground` 텍스트와 이유를 제공한다. 컴포넌트 전체 opacity로 모든 내용을 흐리지 않는다.
- 처리 중에는 원래 폭을 유지하고 스피너 + `요청 중…`을 표시한다. 중복 요청을 막고 성공·실패 후 상태를 갱신한다.
- 이동은 링크, 데이터 변경은 버튼을 사용한다. 카드 링크 안에 예약·찜 버튼을 중첩하지 않는다.

### 입력·선택 컨트롤

- 입력 높이 48px, 배경 화이트, 1px `input` 외곽선, 반경 8px, 좌우 12px, 입력값 16px.
- 라벨은 항상 위에 노출한다. `판매 가격 (원)`, `픽업 시작 시간`처럼 단위와 의미를 명시한다. placeholder는 라벨 대체가 아니다.
- 필수 여부를 텍스트로 표시하고 입력 제약·예시를 도움말에 제공한다. 가격에 `0`을 샘플 값으로 미리 채워 실제 값처럼 저장하지 않는다.
- 오류는 붉은 외곽선 + 오류 아이콘 + 구체적 해결 문구. 예: `판매 가격은 정가보다 낮게 입력해 주세요.` 단, 이 검증은 실제 PRD의 허용 정책 확인 후 적용한다.
- `label`–`id`, `aria-describedby`, `aria-invalid`를 연결한다. 제출 실패 시 오류 요약과 첫 오류 필드로 안내한다.
- checkbox/radio의 도형은 20px로 해도 라벨을 포함한 터치 영역은 44px 이상. 선택 상태에 체크 표시와 텍스트를 사용한다.
- read-only와 disabled를 구분한다. 읽기 전용 값은 선택·복사가 가능하게 유지한다.

### 카드·배지

- 카드: 화이트, 1px `border`, 12px 반경. 사진은 기본 4:3, `object-fit: cover`, 이미지 대체 텍스트 제공. 사진에 중요한 텍스트를 구워 넣지 않는다.
- 상품 카드 순서: 사진 → 매장·상품명 → 할인율·판매가·정가 → 수량 → 예약 마감 → 픽업 가능 시간 → CTA. 위치는 확인된 경우만 표시한다.
- 사진 영역 실패 시 같은 비율의 중립 배경 + `상품 이미지 없음`. 잘못된 상품 사진을 자동 대입하지 않는다.
- 상태 배지는 12px/18px, 내부 여백 4px 8px, 아이콘 14px. 클릭하지 않는 배지는 44px 높이가 필요하지 않다.
- 상품당 필수 상태를 우선하고 장식 배지 남용을 피한다. 품절·판매 종료는 할인 홍보보다 먼저 읽혀야 한다.

### 헤더·내비게이션

- 헤더에는 승인된 브랜드 자산, 현재 화면 또는 위치, 필요한 보조 행동만 배치한다. 확인되지 않은 실제 위치를 기본 위치처럼 보여주지 않는다.
- 소비자 모바일 주요 내비게이션은 실제 라우트 기준 3–5개, 아이콘 + 텍스트. 현재 메뉴는 배경·글자 굵기·표식과 `aria-current="page"`로 표현한다.
- 판매자 화면은 같은 색·폰트로 역할명을 명시한다. 역할 전환 시 메뉴와 권한을 함께 갱신하며, 색상만으로 역할을 구별하지 않는다.
- 검색·필터 선택은 문구와 선택 상태를 유지한다. 필터 결과가 없으면 필터 해제 행동을 제공한다.
- Tabs는 설치된 접근성 패턴의 키보드 이동을 유지한다. 필터 toggle은 `aria-pressed`, 페이지 이동은 링크를 사용한다.

### 다이얼로그·알림·표

- 다이얼로그는 제목·설명·행동을 제공하고 포커스를 내부에 유지한다. 닫힌 뒤 호출 버튼으로 포커스를 복귀시킨다.
- 거절·삭제 등 중요한 결정은 대상과 결과를 명시한다. 제출 전 필요한 사유 입력을 제공하되 요구 여부는 PRD를 따른다.
- 토스트는 보조 확인에만 사용한다. 예약 상태나 오류 원인을 토스트가 사라지면 잃어버리지 않도록 화면 본문에도 남긴다.
- 표는 텍스트 좌측, 금액·수량 우측 정렬. 열 제목·단위·기간을 표시하고 상태 배지를 같은 규칙으로 사용한다.

## 6. 화면별 공통 적용

| 화면 | 기본 구조 | 적용 규칙 |
| --- | --- | --- |
| 소비자 목록·상세 | 위치/검색·필터 → 상품 → 예약 조건 → CTA | 실제 판매가와 픽업 조건 우선. 상세 CTA는 필요 시 하단 고정. 할인·재고·마감 표시를 목록과 상세에서 동일하게 유지 |
| 소비자 예약 내역 | 상태 요약 → 상품·수량·금액 → 픽업 장소/시간 → 다음 행동 | 예약 확정 여부와 결제 여부를 별도 항목으로 표시 |
| 판매자 상품 관리 | 화면 제목 + 등록 CTA → 필터 → 카드/표 | 상품 수정과 예약 처리를 구별. 입력 단위·검증은 공통 폼 규칙 사용. 저장 중 중복 제출 방지 |
| 판매자 예약 관리 | 픽업 대기 요약 → 상태 필터 → 예약 상세 → 판매 완료/취소 | 판매 완료 Primary, 취소 Outline. 서버 응답 전 처리 완료로 표시하지 않음 |
| 로그인·역할 진입 | 승인된 브랜드 자산 → 제목·설명 → 폼 → 보조 링크 | 최대 400px, 큰 장식 히어로 생략. 로그인 수단은 기존 인증 구현만 사용. 비밀번호 표시 토글은 상태를 읽어 주고 입력·자동완성·붙여넣기를 허용 |
| 리포트 | 기간·매장 필터 → KPI → 차트 → 상세 표 | 매출·예약·판매 완료 등 지표의 정의와 집계 기준을 명시. 통화·수량 단위, 마지막 갱신 시각, 비교 기간을 표시 |

리포트는 그린을 대표 시리즈로 사용하고 오렌지는 비교·주의 지점에 한정한다. 범례·직접 라벨·선 패턴·마커를 함께 사용하며 차트와 같은 정보를 표나 텍스트로 제공한다. `데이터 없음`, `0건`, `불러오기 실패`를 구별한다. 증가를 무조건 성공 색으로 칠하지 않는다(취소율 증가 등).

## 7. 가격·할인율·재고·시간 표시

### 금액과 할인

- KRW 정수 표기: `6,000원`. `Intl.NumberFormat("ko-KR")` 사용. 통화 기호와 `원`을 중복하지 않는다.
- 판매가를 가장 크게 표시하고 정가는 더 작게 취소선 처리한다. 스크린리더용 `정가`, `판매가` 라벨을 제공한다.
- 예시: **50% 할인 · 6,000원** / 정가 ~~12,000원~~ / `1세트 기준`.
- 단가·수량·총액을 혼동하지 않는다. 예: `6,000원 × 2개`, `총 12,000원`. 추가 비용이 있다면 확정 전 함께 표시한다.
- 할인율은 서버의 공식 표시값을 우선한다. 표시값이 없어 클라이언트 계산이 필요하면 팀의 반올림 정책을 먼저 확인한다. 기본 UI 제안은 과대 표시를 피하는 `floor((정가 - 판매가) / 정가 × 100)`이다.
- 정가가 0·누락·잘못된 값이거나 판매가가 정가보다 높으면 할인율 계산을 하지 않는다. 일반 판매가를 표시하거나 검증 오류로 처리하되 PRD를 따른다. 실제 0원과 미입력값을 구별한다.

### 재고

- 서버의 판매 가능 수량으로 `3개 남음`을 표시하고 `개`, `팩`, `세트` 등 상품 단위를 유지한다.
- 수량을 모르면 `재고 확인 중` 또는 `재고를 확인할 수 없어요`로 표현한다. 임의의 숫자나 `품절`로 대체하지 않는다.
- `품절`은 판매 가능 수량 0으로 확인된 상태. 예약 버튼을 비활성화하고 같은 위치에 이유를 제공한다.
- 소량 재고 강조 기준은 PRD/서버 설정을 따른다. 설정이 없다면 남은 수량만 표시하고 임의로 `품절 임박`을 붙이지 않는다.
- 예약 요청 중 경합으로 재고가 달라지면 값을 갱신하고 `남은 수량이 변경됐어요. 수량을 다시 확인해 주세요.`를 표시한다. 재고 차감·홀드 시점은 UI가 결정하지 않는다.

### 마감과 픽업

- **예약 마감**과 **픽업 가능 시간**을 별도 행으로 표시한다. 예: `예약 마감 오늘 18:30` / `픽업 오늘 18:00–20:00`.
- 국내 서비스 표시 기준은 `Asia/Seoul`. 서버 타임스탬프와 명시적 시간대를 사용하고 기기 로컬 시간대에 맡기지 않는다.
- 날짜가 다르거나 자정을 넘으면 `11월 1일 00:30`처럼 날짜를 포함한다. 상세·리포트에는 필요 시 연도와 `KST`를 표시한다.
- 카운트다운은 정확한 마감 시각을 보완하는 정보다. 초 단위 깜빡임 대신 `마감까지 25분`처럼 분 단위로 갱신하며 1분 미만은 `1분 미만`.
- 마감 임박 기준은 정책 확인 전 임의 설정하지 않는다. 마감 도달 시 신규 요청 CTA를 잠그고 서버 상태를 재확인한다. 오류라면 `마감 여부 확인 필요`를 표시한다.
- 판매 마감이 기존 확정 예약의 픽업 취소를 의미하지 않는다. 상품 판매 상태와 개별 예약 상태를 독립적으로 표현한다.

## 8. 상태별 UI

아래 명칭은 **표현 규칙**이며 API enum이나 승인 플로우를 새로 확정하지 않는다. 실제 상태와 전이 가능 행동은 PRD·API를 연결해 결정한다.

| 상태 | 시각·문구 | 행동·접근성 |
| --- | --- | --- |
| 최초 로딩 | 카드·표의 실제 공간을 유지하는 스켈레톤 + `불러오는 중` | 영역 `aria-busy`, 스켈레톤 `aria-hidden`. 빈 결과 문구를 먼저 노출하지 않음 |
| 백그라운드 갱신 | 기존 정보 유지 + `업데이트 중` | 화면 전체 교체 금지. 최신 확인이 필요한 예약 행동은 응답 검증 |
| 제출 중 | 스피너 + `요청 중…` | 중복 제출 방지, 처리 상태 안내. 성공 전 완료 배지 금지 |
| 요청 결과 불명 | `처리 결과를 확인하고 있어요` | 타임아웃을 즉시 거절로 표시하지 않음. 내역 재조회 후 재시도 결정, 중복 예약 방지 |
| 로딩 오류 | 오류 아이콘 + `상품을 불러오지 못했어요` | `다시 시도` 제공, 폼 값 보존. 기술 로그 대신 사용자가 할 수 있는 행동 설명 |
| 빈 목록 | 중립 아이콘 + `조건에 맞는 상품이 없어요` | 소비자 `필터 초기화`, 판매자 `상품 등록하기` 등 문맥별 행동 |
| 리포트 데이터 없음 | `선택한 기간의 데이터가 없어요` | 기간 변경 제공. 매출 0으로 조작하지 않음 |
| 예약 확정 | 체크 + success 배지 `예약 확정` | 픽업 조건과 다음 행동 제공. 결제 완료 여부는 별도 표시 |
| 예약 거절 | X 아이콘 + danger 배지 `예약 거절` | 승인 제도가 있던 때의 이력에만 표시. 사유를 추측하지 않음 |
| 품절 | 중립 배지 `품절`, 사진만 약하게 낮춘 강조 | 예약 불가. 상품명·가격·상태 텍스트의 대비는 유지 |
| 판매 종료 | 시계/종료 아이콘 + `판매 종료` | 신규 예약 불가. 기존 예약 내역은 별도 상태 유지 |
| 취소·만료 | 중립 배지 + 정확한 상태명 | 지원하는 경우에만 표시. 원인·시각·후속 행동을 실제 데이터로 안내 |
| 픽업 완료 | 체크 + `픽업 완료` | 지원하는 경우에만 표시. 예약 확정과 구별 |

예약 상태 변경은 본문의 배지·설명·버튼을 함께 갱신한다. 중요한 비동기 알림은 `role="status"`/`aria-live="polite"`, 즉시 해결해야 하는 오류는 `role="alert"`를 사용한다. 매분 변하는 카운트다운은 live region으로 반복 낭독하지 않는다.

## 9. 접근성 기준

목표는 **WCAG 2.2 AA**다. 이 문서 자체가 실제 화면의 준수 검증을 대신하지 않는다.

- 일반 텍스트 대비 **4.5:1 이상**, 큰 글자(24px 이상 일반 또는 약 18.67px 이상 굵은 글자) **3:1 이상**. 입력 경계·필수 아이콘·포커스 등 의미 있는 비텍스트 요소는 인접 색과 3:1을 확보한다. [W3C 텍스트 대비 기준](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- 이 프로젝트는 버튼·링크형 컨트롤의 **44×44 CSS px 이상**을 권장 기본값이 아닌 공통 구현 기준으로 사용한다. 이는 WCAG 2.2 AA의 24×24px 최소 기준보다 여유 있는 내부 기준이다. [W3C 터치 대상 최소 기준](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- 모든 컨트롤은 키보드로 접근·작동 가능해야 한다. 포커스는 2px 링과 2px 간격으로 표시하고 sticky UI에 가려지지 않게 한다.
- 선택·승인·거절·품절을 색 외에 텍스트와 아이콘으로 구분한다. 선택 메뉴에는 위치 표식도 제공한다.
- 모든 입력에 프로그램적으로 연결된 라벨이 있어야 한다. 오류와 도움말은 해당 필드에 연결한다. placeholder도 읽을 수 있는 대비를 확보한다.
- 이미지에는 의미 있는 alt, 장식 아이콘에는 `aria-hidden="true"`, 아이콘 전용 버튼에는 구체적인 접근 가능한 이름을 제공한다.
- 확대 200%, 320px 폭에서 필수 정보와 행동을 잃지 않는다. 테이블 등 필요한 예외 외에는 페이지 전체 가로 스크롤을 만들지 않는다.
- `prefers-reduced-motion: reduce`에서는 스켈레톤 애니메이션·스크롤 애니메이션·불필요한 전환을 제거한다.
- 폼 오류·비동기 상태는 화면과 보조 기술에 함께 전달한다. 색상·토스트·hover에만 정보를 두지 않는다.

대표 대비값(불투명 sRGB 조합, 계산값 반올림 표시):

| 조합 | 대비 | 판단 |
| --- | --- | --- |
| 흰색 / 브랜드 `#248A60` | 약 4.30:1 | 작은 텍스트 사용 금지 |
| `#248A60` / `#EAF6EF` | 약 3.88:1 | 작은 텍스트 사용 금지 |
| `#176B49` / `#EAF6EF` | 약 5.85:1 | 보조 버튼·성공 배지 가능 |
| `#626B77` / `#F8FAF8` | 약 5.15:1 | 기본 배경의 보조 글자 가능 |
| `#1F2937` / `#F59E0B` | 약 6.83:1 | 오렌지 배경 텍스트 가능 |

## 10. Tailwind CSS·shadcn/ui 구현 가이드

### 10.1 적용 전 확인

현재 설치 버전을 확인할 수 없으므로 다음은 **문서 속 적용 예시**다. 실제 구현 시 먼저 `package.json`, lockfile, 전역 CSS, `tailwind.config.*`, `components.json`, 기존 Button/Card/Input를 확인한다. 아래 코드 때문에 기존 설정을 통째로 교체하거나 shadcn을 재초기화하지 않는다.

- 이미 있는 공통 컴포넌트의 import 경로·props·접근성 동작을 유지하고 토큰과 variant를 매핑한다.
- Tailwind v4는 CSS `@theme inline`, v3는 `theme.extend`를 사용하는 별도 경로로 적용한다. 두 설정 방식을 동시에 도입하지 않는다. [v4 테마 문서](https://tailwindcss.com/docs/theme), [v3 테마 문서](https://v3.tailwindcss.com/docs/theme)
- shadcn의 `accent`는 메뉴 hover/선택용 중립 강조에 쓰일 수 있으므로 **Light Green**으로 매핑한다. 브랜드 Accent Orange는 `highlight`라는 별도 토큰을 사용한다. [shadcn 테마 문서](https://ui.shadcn.com/docs/theming)

### 10.2 의미 토큰 예시

이 예시는 **완전한 CSS 색상값(HEX)** 형식이다. 기존 프로젝트가 `hsl(var(--primary))`처럼 HSL 채널만 저장한다면 HEX를 그대로 넣지 말고 기존 형식에 맞춰 변환한다. 컴포넌트의 소비 방식과 토큰 형식을 일치시켜야 한다.

```css
:root {
  /* 확정 브랜드 원시값 */
  --brand-green: #248A60;
  --brand-light-green: #EAF6EF;
  --brand-orange: #F59E0B;
  --font-family-sans: "Pretendard Variable", "Pretendard", -apple-system,
    BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR",
    "Malgun Gothic", "Segoe UI", sans-serif;

  /* 표면·글자 */
  --background: #F8FAF8;
  --foreground: #1F2937;
  --card: #FFFFFF;
  --card-foreground: var(--foreground);
  --popover: #FFFFFF;
  --popover-foreground: var(--foreground);
  --muted: #F1F5F2;
  --muted-foreground: #626B77;
  --border: #E2E8E3;
  --input: #64748B;
  --ring: #176B49;

  /* 행동 */
  --primary: #1F7A54;
  --primary-foreground: #FFFFFF;
  --primary-hover: #196545;
  --primary-active: #145238;
  --secondary: var(--brand-light-green);
  --secondary-foreground: #176B49;
  --accent: var(--brand-light-green);
  --accent-foreground: #176B49;
  --link: #176B49;
  --highlight: var(--brand-orange);
  --highlight-foreground: var(--foreground);

  /* 업무 상태 */
  --success: #176B49;
  --success-bg: var(--brand-light-green);
  --warning: #B45309;
  --warning-bg: #FFFBEB;
  --destructive: #B91C1C;
  --destructive-foreground: #FFFFFF;
  --danger-bg: #FEF2F2;
  --info: #1D4ED8;
  --info-bg: #EFF6FF;

  /* 형태 */
  --radius: 0.75rem;
  --radius-control: 0.5rem;
  --radius-dialog: 1rem;
  --shadow-card: 0 2px 8px rgb(31 41 55 / 0.04);
}
```

### 10.3 Tailwind v4에 연결하는 예시

기존 전역 CSS의 Tailwind import와 shadcn 관련 import는 보존한다. 위 `:root` 블록을 같은 스타일 진입점의 테마에 연결한다. 사용하지 않는 토큰도 필요 시 같은 규칙으로 연결한다.

```css
/* Tailwind v4 스타일 진입점. 기존 import가 있으면 중복 추가하지 않는다. */
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-family-sans);
  --color-brand: var(--brand-green);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-hover: var(--primary-hover);
  --color-primary-active: var(--primary-active);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
  --color-link: var(--link);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-success-bg: var(--success-bg);
  --color-warning: var(--warning);
  --color-warning-bg: var(--warning-bg);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-danger-bg: var(--danger-bg);
  --color-info: var(--info);
  --color-info-bg: var(--info-bg);
  --radius-sm: 0.375rem;
  --radius-md: var(--radius-control);
  --radius-lg: var(--radius);
  --radius-xl: var(--radius-dialog);
}
```

### 10.4 Tailwind v3 설정 예시

기존 `tailwind.config.*`의 `theme.extend`에 필요한 키만 통합한다. `content`, plugins, 기존 preset은 보존한다.

```js
// theme.extend에 통합할 항목 예시. 설정 파일 전체가 아니다.
colors: {
  brand: "var(--brand-green)",
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
  popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
  primary: {
    DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)",
    hover: "var(--primary-hover)", active: "var(--primary-active)"
  },
  secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
  accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
  highlight: { DEFAULT: "var(--highlight)", foreground: "var(--highlight-foreground)" },
  muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
  destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
  success: { DEFAULT: "var(--success)", bg: "var(--success-bg)" },
  warning: { DEFAULT: "var(--warning)", bg: "var(--warning-bg)" },
  info: { DEFAULT: "var(--info)", bg: "var(--info-bg)" },
  "danger-bg": "var(--danger-bg)",
  border: "var(--border)", input: "var(--input)", ring: "var(--ring)",
  link: "var(--link)"
},
fontFamily: { sans: ["var(--font-family-sans)"] },
borderRadius: {
  sm: "0.375rem", md: "var(--radius-control)",
  lg: "var(--radius)", xl: "var(--radius-dialog)"
}
```

이 HEX/`var()` 방식의 v3 예시는 `bg-primary/90` 같은 투명도 수식어 지원을 전제하지 않는다. hover에는 `hover:bg-primary-hover`를 사용한다. 기존 설정이 `<alpha-value>`를 지원하는 RGB/HSL 채널 방식이면 해당 방식을 유지하고 색상값을 변환한다.

### 10.5 컴포넌트 연결과 화면 예시

| 컴포넌트 | 토큰·크기 연결 |
| --- | --- |
| Button/default | `bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active`, `min-h-12 rounded-md px-4` |
| Button/secondary | `bg-secondary text-secondary-foreground`, 같은 높이·반경 |
| Button/outline | `border-input bg-card text-foreground` |
| Input·Select·Textarea | `border-input bg-card text-foreground placeholder:text-muted-foreground`, 입력 텍스트 `text-base` |
| Card | `rounded-lg border-border bg-card text-card-foreground`, `p-4 sm:p-6` |
| Badge/확정 | `bg-success-bg text-success`, 체크 + `예약 확정` |
| Badge/거절 | `bg-danger-bg text-destructive`, X + `예약 거절` |
| Dialog·Popover | `bg-popover text-popover-foreground`, 기존 포커스 관리 유지 |

기존 Button variant와 기본 높이·disabled opacity·focus ring이 이 기준과 다른 경우 해당 공통 컴포넌트에서 조정할 후속 작업으로 기록한다. 각 화면에서 임시 클래스를 덧붙여 우선순위를 다투게 하지 않는다. 임의의 `variant="success"` 등이 이미 구현되어 있다고 가정하지 않는다.

아래는 향후 React/Tailwind 환경에서 사용할 수 있는 예약 요약 구조의 예시다. import 경로·컴포넌트 props·데이터 연결은 실제 앱에 맞춘다. 예시는 샘플 데이터이며 새 API나 라우트를 정의하지 않는다.

```tsx
<main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
  <h1 className="text-2xl font-bold leading-8 text-foreground lg:text-[32px] lg:leading-10">
    예약 요청 확인
  </h1>
  <section aria-labelledby="product-title"
    className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-6">
    <h2 id="product-title" className="text-lg font-semibold leading-7">상품명</h2>
    <p className="mt-3 flex flex-wrap items-baseline gap-2 tabular-nums">
      <span className="text-sm font-semibold text-link">50% 할인</span>
      <span className="text-2xl font-bold text-foreground">
        <span className="sr-only">판매가 </span>6,000원
      </span>
      <span className="text-sm text-muted-foreground">
        <span className="sr-only">정가 </span><del>12,000원</del>
      </span>
    </p>
    <dl className="mt-4 space-y-2 text-sm leading-5">
      <div className="flex flex-wrap gap-2"><dt>남은 수량</dt><dd>3세트</dd></div>
      <div className="flex flex-wrap gap-2"><dt>예약 마감</dt><dd>오늘 18:30</dd></div>
      <div className="flex flex-wrap gap-2"><dt>픽업 시간</dt><dd>오늘 18:00–20:00</dd></div>
    </dl>
    <p id="approval-note" className="mt-4 text-sm leading-5 text-muted-foreground">
      예약하면 바로 확정돼요.
    </p>
    {/* 실제 구현에서는 기존 Button의 default variant로 이 스타일을 공통화한다. */}
    <button type="button" aria-describedby="approval-note"
      className="mt-4 min-h-12 w-full rounded-md bg-primary px-4 py-3
        text-sm font-semibold text-primary-foreground hover:bg-primary-hover
        active:bg-primary-active focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card">
      예약 요청하기
    </button>
  </section>
</main>
```

버튼의 로딩·disabled·재고 확인·실제 요청·오류 처리는 7–8장의 규칙과 기존 API에 연결해야 한다.

## 11. 실제 화면 적용 순서와 완료 기준

1. **기존 앱 대조:** 실제 PRD·개발 규칙·설치 버전·컴포넌트 목록을 확인하고 이 문서의 미확인 항목을 갱신한다. 브랜드 자산과 예약 정책도 확인한다.
2. **기반 연결:** 승인된 방식으로 Pretendard를 로드하고 기존 전역 테마에 의미 토큰을 연결한다. 접근성 파생색과 브랜드 원색을 구별한다.
3. **공통 컴포넌트:** Button, Input, Card, Badge, Header/Navigation 순서로 기존 구현에 매핑한다. 데모 화면에서 기본·포커스·로딩·disabled·오류를 함께 확인한다.
4. **화면 적용:** 소비자 목록·상세 → 예약 내역 → 판매자 관리 → 로그인 → 리포트 순서로 같은 구성요소를 재사용한다. 실제 개발 우선순위는 팀 계획에 따른다.
5. **상태 연결:** 서버 상태에 대기·승인·거절·품절·종료 UI를 연결하고 경합·실패·결과 불명 상태를 확인한다. 문서만으로 새 상태 전이를 만들지 않는다.
6. **검증:** 320/390/768/1024/1440px, 확대 200%, 키보드와 스크린리더, 긴 상품명·큰 금액·사진 없음·0개 재고·날짜 경계·통신 오류를 확인한다.

검토 체크리스트:

- [ ] 승인된 A안 색상과 Pretendard가 적용되고 임시 브랜드 자산을 확정 자산처럼 사용하지 않는다.
- [ ] 일반 텍스트 4.5:1, 필수 UI 경계·포커스 3:1을 실제 배경에서 확인했다.
- [ ] 주요 터치 영역 44×44px, 입력 라벨·오류 연결, 키보드 포커스가 확보됐다.
- [ ] 목록·상세·예약·판매자 화면의 가격·수량·시간·상태가 일치한다.
- [ ] 대기·승인·거절·품절·로딩·오류·빈 화면을 색상 외에도 식별할 수 있다.
- [ ] 모바일 고정 영역과 키보드가 본문·폼·CTA를 가리지 않는다.
- [ ] 리포트의 0·데이터 없음·오류를 구별하고 지표 정의·기간·단위를 표시한다.
- [ ] 기존 API·권한·공통 컴포넌트와 충돌 없이 적용됐으며 실제 화면을 검증했다.

이번 변경 범위는 이 `DESIGN.md` 한 파일이다. 비교용 HTML, 기존 코드·설정·컴포넌트는 수정하지 않았다.
