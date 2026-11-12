# OSS Radar

GitHub 오픈소스 트렌드(어떤 레포지토리·라이브러리가 뜨고 있는지)를 자동 수집·분석하고, Claude AI로 월간 리포트를 생성하는 풀스택 대시보드.
UI는 **영어(기본)** 와 **한국어**를 지원합니다.

```
┌─────────────────────────────────────────────────────┐
│  GitHub API  →  Crawler  →  PostgreSQL              │
│                    ↓                                 │
│           DependencyParser (5종)                    │
│           ActiveLevelCalculator                     │
│                    ↓                                 │
│   Claude API  →  MonthlyReport (en / ko)           │
│                    ↓                                 │
│   Next.js 14 Dashboard (SSR · next-intl · Radar)    │
└─────────────────────────────────────────────────────┘
```

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Backend | Kotlin 1.9 · Spring Boot 3.3 · Spring WebFlux · JPA |
| Database | PostgreSQL 16 · Flyway 10 |
| AI | Claude API (claude-sonnet-4-6) |
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts · next-intl |
| Infra | Docker · Docker Compose |

## 프로젝트 구조

```
oss-tech/
├── backend/                   # Spring Boot 애플리케이션
│   ├── src/main/kotlin/
│   │   ├── api/               # REST 컨트롤러
│   │   ├── claude/            # Claude API 연동 + 리포트 생성 (en/ko)
│   │   ├── crawler/           # 크롤러, 의존성 파서, Active Level 계산
│   │   ├── github/            # GitHub API 클라이언트
│   │   ├── config/            # WebClient, CORS 설정
│   │   ├── domain/            # JPA 엔티티
│   │   └── repository/        # Spring Data JPA
│   └── src/main/resources/
│       └── db/migration/      # Flyway 마이그레이션 (V1 초기 스키마, V2 리포트 언어)
├── frontend/                  # Next.js 14 애플리케이션
│   ├── messages/              # 번역 파일 (en.json, ko.json)
│   └── src/
│       ├── app/[locale]/      # App Router 페이지 (en: /, ko: /ko)
│       ├── components/        # 공통 컴포넌트 (RadarPlot 등)
│       ├── i18n/              # next-intl 라우팅/내비게이션 설정
│       ├── lib/               # API 클라이언트 + 유틸리티
│       └── types/             # TypeScript 타입 정의
├── scripts/dev/               # 개발용 샘플 데이터 (seed-demo.sql / clear-demo.sql)
├── docker-compose.yml
├── .env.example
└── README.md
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/domains` | 도메인별 레포지토리 수 |
| GET | `/api/v1/repositories` | 레포지토리 목록 (score/stars 정렬) |
| GET | `/api/v1/libraries` | 라이브러리 순위 (도메인·월 기준) |
| GET | `/api/v1/libraries/trend?name=&domain=` | 라이브러리 6개월 트렌드 (**`@scope/name` 처럼 `/`가 든 이름은 이 방식**) |
| GET | `/api/v1/libraries/{name}/trend` | 위와 동일 (이름에 `/`가 없을 때만 사용 가능) |
| GET | `/api/v1/reports?domain=&lang=` | AI 리포트 목록 (`lang`: `en`(기본) \| `ko`) |
| GET | `/api/v1/reports/{id}` | AI 리포트 상세 (Markdown) |
| POST | `/api/v1/reports/generate?domain=&yearMonth=&lang=` | AI 리포트 수동 생성 |
| POST | `/api/v1/crawl/trigger` | GitHub 크롤링 수동 트리거 |

Swagger UI: `http://localhost:8089/swagger-ui.html`

## 실행 방법

> **포트**: 대시보드 `3033` · 백엔드 `8089` · PostgreSQL `5433` (Docker). 다른 프로젝트와 겹치지 않도록 기본 포트를 피해 두었습니다.

### 사전 요구사항

- Docker Desktop 4.x 이상 (그 외 로컬 설치 불필요 — JDK/Gradle/Node/PostgreSQL 전부 컨테이너에서 실행됨)

### 1. (선택) 환경 변수 설정

`.env` 파일 없이도 `docker compose up`만으로 DB 포함 전체 스택이 기본값으로 바로 기동됩니다.
GitHub 크롤링, Claude 리포트 생성 등 외부 API를 쓰려면 아래처럼 `.env`를 설정하세요.

```bash
cp .env.example .env
```

`.env` 파일에서 아래 값을 실제 값으로 교체합니다.

```env
GITHUB_TOKEN=ghp_your_token_here
CLAUDE_API_KEY=sk-ant-your_key_here
```

### 2. Docker Compose 실행

```bash
# 전체 스택 빌드 및 시작 (첫 빌드는 5~10분 소요)
docker compose up --build

# 백그라운드 실행
docker compose up --build -d
```

### 3. 접속 확인

| 서비스 | URL |
|--------|-----|
| 대시보드 (영어) | http://localhost:3033 |
| 대시보드 (한국어) | http://localhost:3033/ko |
| Swagger UI | http://localhost:8089/swagger-ui.html |
| API 기본 | http://localhost:8089/api/v1 |
| PostgreSQL | localhost:5433 (DB: osstech) |

### 로컬 개발 (앱은 직접 실행, DB만 Docker)

PostgreSQL을 로컬에 설치할 필요 없이 DB 컨테이너만 띄우면 됩니다. 백엔드/프론트 컨테이너가 떠 있다면 포트(8089)가 겹치므로 먼저 멈추세요.

```bash
docker compose stop backend frontend   # 이미 떠 있는 경우에만
docker compose up -d postgres          # localhost:5433 (osstech / osstech_secret)
```

**Backend** — `http://localhost:8089`

```bash
cd backend
./gradlew bootRun
```

`application.yml` 기본값이 위 DB(`localhost:5433`)에 맞춰져 있어 별도 환경 변수 없이 실행됩니다.
IDE에서 실행할 때도 마찬가지입니다.

**Frontend** — `http://localhost:3000`

```bash
cd frontend
npm install
npm run dev
```

로컬 백엔드를 바라보도록 `frontend/.env.local`에 아래 값이 필요합니다 (git에 올라가지 않음).

```env
INTERNAL_API_URL=http://localhost:8089
NEXT_PUBLIC_API_URL=http://localhost:8089
```

> **Docker끼리, 로컬끼리 짝을 맞추세요.** Docker 프론트(3033)는 Docker 네트워크의 `backend` 컨테이너로만 통신합니다.
> 로컬에서 띄운 백엔드(8089)와 Docker 프론트를 섞으면 `ENOTFOUND backend` 오류가 납니다.
> 개발 서버를 켜 둔 채 `npm run build`를 돌리면 같은 `.next` 폴더를 덮어써서 서버가 깨집니다.
> 빌드만 확인하려면 `NEXT_DIST_DIR=.next-verify npm run build` 로 폴더를 분리하세요.

### 샘플 데이터로 화면 확인하기

`GITHUB_TOKEN` 없이도 UI를 확인할 수 있도록 가상의 레포지토리·라이브러리·리포트(영어/한국어)를 넣는 스크립트가 있습니다.

```bash
# 넣기
docker exec -i oss-tech-postgres psql -U osstech -d osstech < scripts/dev/seed-demo.sql

# 비우기 — 실제 크롤링 전에는 반드시 비워 주세요 (수집 데이터 전체가 삭제됩니다)
docker exec -i oss-tech-postgres psql -U osstech -d osstech < scripts/dev/clear-demo.sql
```

> API 응답은 프론트에서 5~10분간 캐시됩니다(`revalidate`). 데이터를 바꾼 직후에 화면이 그대로면 잠시 뒤 새로고침하세요.

## 다국어 (English / 한국어)

| 항목 | 영어 (기본) | 한국어 |
|------|-------------|--------|
| URL | `/libraries` | `/ko/libraries` |
| 번역 파일 | `frontend/messages/en.json` | `frontend/messages/ko.json` |
| AI 리포트 | `lang=en` | `lang=ko` |

- 첫 방문 시 브라우저 언어를 감지해 한국어 브라우저는 `/ko`로 이동합니다. 헤더의 언어 버튼으로 바꾸면 선택이 쿠키에 저장됩니다.
  감지를 끄려면 `frontend/src/i18n/routing.ts`의 `defineRouting`에 `localeDetection: false`를 추가하세요.
- 새 문구는 **두 파일에 같은 키**로 추가합니다. 날짜·숫자 형식은 로케일에 맞춰 자동으로 바뀝니다.
- 검색 노출용 `hreflang`/canonical 은 페이지마다 자동 생성됩니다. 배포 시 `.env`의 `SITE_URL`(예: `https://example.com`)을 실제 주소로 설정하세요 (런타임 변수라 이미지 재빌드가 필요 없습니다).
- 월간 리포트는 영어·한국어를 각각 생성합니다. 요청한 언어의 리포트가 없으면 다른 언어로 보여주고 안내 문구를 표시합니다.

## Active Level Score

레포지토리 활성도 점수 산출 공식:

```
score = (commits_30d × 3 + prs_merged_30d × 2 + issues_closed_30d × 1) / ln(stars + 1)

S: score ≥ 50  (매우 활발)
A: score ≥ 20  (활발)
B: score ≥  5  (보통)
C: score ≥  0  (낮음)
-: null         (데이터 없음)
```

## 개발 명령어

```bash
# 백엔드 테스트
cd backend && ./gradlew test

# 프론트엔드 타입 검사 / 빌드
cd frontend && npm run type-check
cd frontend && NEXT_DIST_DIR=.next-verify npm run build

# Docker 로그 확인
docker compose logs -f backend
docker compose logs -f frontend

# 특정 서비스만 재빌드
docker compose up --build backend

# 전체 정리 (볼륨 포함)
docker compose down -v
```

## 스케줄러

| 스케줄 | 작업 |
|--------|------|
| 매일 03:00 KST | 전 도메인 GitHub 크롤링 (레포 수집 + Active Level 계산 + 의존성 파싱) |
| 매월 1일 09:00 KST | 전 도메인 × (영어, 한국어) AI 월간 리포트 자동 생성 |

수동 크롤링: `POST /api/v1/crawl/trigger?domain=frontend`
수동 리포트 생성: `POST /api/v1/reports/generate?domain=frontend&yearMonth=2026-04&lang=en`

### 크롤링 도메인

`frontend`, `backend`, `devops`, `mobile`, `data`, `security` 6개 도메인을 각각 동일한 이름의 GitHub topic(`data`→`data-science`)으로 검색해 상위 30개 레포지토리를 수집합니다.
