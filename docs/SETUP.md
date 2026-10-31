# 개발 환경과 패키지

[시작 안내](../README.md) · [공통 지침](../AGENTS.md)

## 준비 범위

개발 의존성과 설정을 준비했습니다. 설치 결과는 [설치 기록](#설치-기록)을 확인합니다. 인증, 소비자 화면 개발용 미리보기, DB 스키마·RLS가 구현됐고 판매자 화면·서버 API·Storage는 아직 없습니다. 작업별 상태는 [팀 작업표](TEAM_TASKS.md)를 확인합니다.

## 팀원 설치 방법

프로젝트 루트 `freshstock-hackathon/`에서 Node.js 24.14.1과 npm 11.11.0을 사용합니다. nvm 사용자는 `nvm install` 후 `nvm use`로 `.nvmrc` 버전을 적용합니다.

```bash
npm ci
```

`package.json`은 직접 의존성의 정확한 버전을 지정하고 `package-lock.json`은 하위 의존성까지 고정합니다. `.npmrc`의 `save-exact=true`를 유지합니다. 팀원은 다른 패키지 관리자의 잠금 파일을 만들지 않습니다. 새 의존성 추가·업데이트는 총괄이 조율합니다.

## 명령과 실행 조건

| 명령 | 용도 | 현재 조건 |
| --- | --- | --- |
| `npm ci` | 잠금 파일대로 설치 | 사용 가능 |
| `npm run lint` | ESLint 검사 | 사용 가능 |
| `npm run typecheck` | 엄격한 TypeScript 검사 | 사용 가능 |
| `npm run test:run` | Vitest 일회 실행 | 테스트 없음은 실패로 보고. passWithNoTests 사용 안 함 |
| `npm test` | Vitest 감시 실행 | 사용 가능 |
| `npm run dev` | 로컬 Next.js 서버 | 사용 가능 |
| `npm run build` | 프로덕션 빌드 | 사용 가능 |
| `npm start` | 빌드 결과 실행 | 성공한 빌드 필요 |
| `npm run ui -- --help` | 설치된 shadcn CLI 도움말 | 사용 가능 |

## 설정 파일

- `.nvmrc`, `package.json`: Node.js·npm 버전과 명령.
- `tsconfig.json`, `next-env.d.ts`: strict 모드, Next.js 타입, `@/*` 루트 별칭.
- `eslint.config.mjs`: Next.js Core Web Vitals·TypeScript 규칙.
- `postcss.config.mjs`: Tailwind CSS 4 PostCSS 플러그인.
- `.gitignore`: node_modules·빌드·환경 변수·로컬 산출물 제외. `.env.example`은 공유.

## Tailwind·shadcn 사용 준비

Tailwind 4, PostCSS 플러그인, shadcn CLI, Radix UI, 아이콘·클래스 유틸리티·애니메이션 의존성을 설치합니다. 현재 `components/ui/`에는 button·input·label만 있고 `components.json`은 없습니다.

C와 총괄이 앱 초기화 시 `app/globals.css`의 Tailwind import·디자인 토큰, `components.json`, `lib/utils.ts`의 클래스 결합 유틸리티를 구성합니다. 이어 필요한 컴포넌트만 생성합니다. CLI 초기화가 기존 파일·의존성을 바꾸는지 확인하고, 전체 컴포넌트를 미리 생성하지 않습니다.

## 서비스 연결

[.env.example](../.env.example)의 키 이름을 참고해 각자 `.env.local`을 준비합니다. 실제 키는 커밋하지 않습니다. SDK 설치는 Supabase 프로젝트·RLS·Storage 생성이나 OpenAI API 연결 완료를 의미하지 않습니다. AI 모델은 지원 기능을 확인한 뒤 지정합니다.

네이버 지도는 NCP 콘솔의 같은 Application에서 Dynamic Map과 Geocoding을 모두 켭니다. Web 서비스 URL에는 `http://localhost`와 배포 도메인을 포트·경로 없이 등록합니다. `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`는 공개값이고, `NAVER_MAPS_CLIENT_SECRET`은 서버 전용입니다. 무료 이용량은 Maps 대표 계정에만 제공됩니다.

Vercel CLI·Supabase CLI는 현재 로컬 앱 패키지에 추가하지 않습니다. 배포·마이그레이션 워크플로를 정할 때 별도로 준비합니다.

## 설정 근거

- [Next.js 공식 설치 안내](https://nextjs.org/docs/app/getting-started/installation): Next.js 16은 ESLint를 별도 명령으로 실행합니다.
- [shadcn 공식 수동 설치 안내](https://ui.shadcn.com/docs/installation/manual): CLI 설치와 테마·컴포넌트 구성은 구분합니다.

## 설치 기록

설치 버전과 검증 결과는 이 기록을 기준으로 합니다. 이후 의존성이 변경되면 이 기록도 갱신합니다.

**기록일: 2026-10-31 · 환경: macOS arm64, Node.js 24.14.1, npm 11.11.0**

`npm ci`로 684개 패키지를 설치했습니다. `package-lock.json`의 나머지 97개 항목은 다른 플랫폼용 선택 패키지로, 이 환경에는 설치되지 않습니다. `package.json`과 잠금 파일은 설치 과정에서 변경되지 않았습니다.

| 구분 | 패키지 |
| --- | --- |
| 프레임워크 | next 16.4.3, react 19.3.1, react-dom 19.3.1, server-only 0.0.1 |
| 데이터·AI·검증 | @supabase/ssr 0.12.7, @supabase/supabase-js 2.118.0, openai 7.47.0, zod 4.6.7 |
| UI | radix-ui 1.8.1, lucide-react 1.66.0, recharts 3.10.1, class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 3.7.0 |
| 스타일 도구 | tailwindcss 4.3.3, @tailwindcss/postcss 4.3.3, postcss 8.5.32, tw-animate-css 1.4.0, shadcn 4.23.0 |
| 개발 도구 | typescript 5.9.3, eslint 9.39.5, eslint-config-next 16.4.3, vitest 5.0.5, @types/node 24.19.2, @types/react 19.3.0, @types/react-dom 19.3.0 |

| 확인 항목 | 결과 |
| --- | --- |
| `npm ci` | 성공 |
| `npm ls --all` | 종료 코드 0 |
| 런타임 패키지 import | Next.js 제외 12개 정상. Next.js는 `next --version`으로 확인 |
| `npm run ui -- --help` | 정상 |
| `npm run lint` | 오류 0, 경고 1(`postcss.config.mjs`의 익명 default export). 앱 코드 검증 아님 |
| `npm run typecheck` | 통과. 기능 코드가 없어 타입 환경만 확인 |
| `npm run test:run` | **실패(종료 코드 1): 테스트 파일 없음** |
| `npm run build` | **실패(종료 코드 1): `app`·`pages` 디렉터리 없음** |
| `npm run dev`, `npm start` | 미실행. 앱 진입 파일이 없음 |

위 표는 설치 당시 기록입니다. 당시 테스트와 빌드 실패는 설치 문제가 아니라 코드가 없어서 발생했습니다.

현재 결과(2026-10-31, `main` 629c1cb): `npm run lint` 오류 0·경고 1, `npm run typecheck` 통과, `npm run test:run` 1개 파일 15개 테스트 통과, `npm run build` 성공. 소비자 미리보기 테스트만 있으며 가격·예약 테스트는 없습니다. `npm run dev`, `npm start`는 미실행입니다.

알려진 사항:

- `npm audit --omit=dev`는 취약점 0건입니다. 전체 `npm audit`는 21건(moderate 19, low 2)으로, 모두 eslint·eslint-config-next·shadcn 계열 개발 도구에서 발생합니다. `npm audit fix --force`는 주요 버전을 크게 되돌리는 변경을 제안하므로 실행하지 않습니다. 대응은 총괄이 판단합니다.
- `npm ls --depth=0`이 `@emnapi/*`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`을 `extraneous`로 표시합니다. 모두 잠금 파일의 선택 패키지이고 `npm ci`가 설치한 항목입니다. 지우기 위해 `npm prune`을 실행하지 않습니다.
