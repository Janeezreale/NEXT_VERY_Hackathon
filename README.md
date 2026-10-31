# 신선식품 마감 할인 플랫폼 · 팀 시작 안내

판매자가 남은 상품을 사진으로 등록하고, 소비자가 지역별 할인 상품을 찾아 방문 수령을 예약하는 서비스입니다.

**현재 상태: 개발 패키지 설치·기본 설정 완료. 기능 화면·DB·API는 아직 없습니다.** 이 폴더를 향후 단일 프로젝트의 루트로 사용합니다. 이 폴더를 팀 문서의 단일 기준으로 사용합니다.

비교 결과는 [지시 파일 통합 기록](docs/DOCUMENT_MERGE.md), 환경 변수 이름은 [.env.example](.env.example)을 참고합니다.

환경 준비와 명령은 [개발 환경 안내](docs/SETUP.md)를 먼저 확인하세요.

## 처음 참여한다면

1. [PRD](docs/PRD.md)에서 서비스 범위와 완료 기준을 읽습니다.
2. [팀 작업표](docs/TEAM_TASKS.md)에서 본인의 작업 ID, 담당 경로, 선행 작업을 찾습니다.
3. [참여 가이드](CONTRIBUTING.md)의 절차에 따라 작업을 맡고, [AI 요청 템플릿](docs/WORK_TEMPLATE.md)을 복사해 Codex 또는 Claude Code에 전달합니다.

| 나는 누구인가 | 첫 작업 | 주로 볼 문서 |
| --- | --- | --- |
| 개발 총괄 | L01: 미정 계약 확정 | [설계·폴더 지도](docs/ARCHITECTURE.md), [API](docs/API_CONTRACT.md), [데이터](docs/DATA_MODEL.md), [가격](docs/PRICING.md) |
| 팀원 A · 판매자 | A01: 상품 등록 화면 명세 | [팀 작업표](docs/TEAM_TASKS.md), [API](docs/API_CONTRACT.md) |
| 팀원 B · 소비자 | B01: 상품 탐색 화면 명세 | [팀 작업표](docs/TEAM_TASKS.md), [API](docs/API_CONTRACT.md) |
| 팀원 C · 공통 UI | C01: 공통 화면 상태·컴포넌트 명세 | [설계·폴더 지도](docs/ARCHITECTURE.md), [팀 작업표](docs/TEAM_TASKS.md) |

## 문서 찾기

| 문서 | 찾을 내용 |
| --- | --- |
| [기획 원문](plan.md) | 사용자 제공 기획서의 원문 스냅샷 |
| [PRD.md](docs/PRD.md) | 기능, 우선순위, 제외 범위, 사용자 시나리오 |
| [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) | 두 AI 도구가 공유하는 작업 규칙 |
| [API_CONTRACT.md](docs/API_CONTRACT.md) | 화면별 API 제안, 입출력, 오류 |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | 테이블, 재고 처리, 접근 권한 |
| [PRICING.md](docs/PRICING.md) | 가격 공식, 경계값, 검증 사례 |
| [TEAM_TASKS.md](docs/TEAM_TASKS.md) | 담당자, 순서, 작업 경로, 완료 조건 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 작업 시작부터 PR까지 |
| [DEMO_CHECKLIST.md](docs/DEMO_CHECKLIST.md) | 통합 검증·시연 체크리스트 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 기술 스택, 데이터 흐름, 예정 폴더 |
| [docs/DECISIONS.md](docs/DECISIONS.md) | 구현 전에 합의해야 할 사항 |
| [docs/WORK_TEMPLATE.md](docs/WORK_TEMPLATE.md) | 작업 카드, 복사할 AI 프롬프트, 인수인계 |

## 확정과 제안 구분

- **기획 확정**: 기획 원문에 명시된 기술 스택·기능·업무 규칙입니다.
- **구조 제안**: 참여를 돕기 위해 추가한 폴더 경로, 작업 ID, API 이름, 필드 이름입니다. 동작하는 구현을 뜻하지 않습니다.
- **결정 필요**: 기획에 없는 업무 정책입니다. [결정 목록](docs/DECISIONS.md)에서 총괄이 확정하기 전까지 관련 구현을 보류합니다.

원문을 수정하면 관련 문서도 함께 갱신합니다. 원문과 문서가 충돌하면 임의로 구현하지 말고 충돌을 기록합니다. 이 문서 세트는 인접한 다른 프로젝트의 규칙이나 코드를 변경하지 않습니다.
