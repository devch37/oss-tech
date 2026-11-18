# OSS Radar

GitHub 오픈소스 트렌드(어떤 레포지토리·라이브러리가 뜨고 있는지)를 자동 수집·분석하고, AI(기본: OpenAI GPT)로 월간 리포트를 생성하는 풀스택 대시보드.
UI는 **영어(기본)** 와 **한국어**를 지원합니다.

```
┌─────────────────────────────────────────────────────┐
│  GitHub API  →  Crawler  →  PostgreSQL              │
│                    ↓                                 │
│           DependencyParser (5종)                    │
│           ActiveLevelCalculator                     │
│                    ↓                                 │
│   OpenAI API  →  MonthlyReport (en / ko)           │
│                    ↓                                 │
│   Next.js 14 Dashboard (SSR · next-intl · Radar)    │
└─────────────────────────────────────────────────────┘
```

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Backend | Kotlin 1.9 · Spring Boot 3.3 · Spring WebFlux · JPA |
| Database | PostgreSQL 16 · Flyway 10 |
| 리포트 | 기본은 LLM 없이 템플릿 생성 · 선택: OpenAI Responses API(`gpt-5-mini`) / Claude (`LLM_PROVIDER`) |
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts · next-intl |
| Infra | Docker · Docker Compose |

## 프로젝트 구조

```
oss-tech/
├── backend/                   # Spring Boot 애플리케이션
│   ├── src/main/kotlin/
│   │   ├── api/               # REST 컨트롤러
│   │   ├── claude/            # 월간 리포트 생성 서비스 (en/ko) + Claude 클라이언트
│   │   ├── llm/               # 리포트 작성기 (템플릿 기본 / OpenAI·Claude 선택)
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
| GET | `/api/v1/overview` | 전 분야 대시보드 요약 (합계, 분야별 대표 프로젝트·라이브러리, 활동 등급·언어 분포, 상위/숨은 프로젝트) |
| GET | `/api/v1/domains` | 도메인별 레포지토리 수 |
| GET | `/api/v1/repositories` | 레포지토리 목록 (score/stars 정렬) |
| GET | `/api/v1/libraries` | 라이브러리 순위 (도메인·월 기준) |
| GET | `/api/v1/libraries/trend?name=&domain=` | 라이브러리 6개월 트렌드 (**`@scope/name` 처럼 `/`가 든 이름은 이 방식**) |
| GET | `/api/v1/libraries/{name}/trend` | 위와 동일 (이름에 `/`가 없을 때만 사용 가능) |
| GET | `/api/v1/reports?domain=&lang=` | 월간 리포트 목록 (`lang`: `en`(기본) \| `ko`) |
| GET | `/api/v1/reports/{id}` | 월간 리포트 상세 (Markdown) |
| POST | `/api/v1/reports/generate?domain=&yearMonth=&lang=` | 월간 리포트 수동 생성 |
| POST | `/api/v1/crawl/trigger` | GitHub 크롤링 수동 트리거 |

Swagger UI: `http://localhost:8089/swagger-ui.html`

## 실행 방법

> **포트**: 대시보드 `3033` · 백엔드 `8089` · PostgreSQL `5433` (Docker). 다른 프로젝트와 겹치지 않도록 기본 포트를 피해 두었습니다.

### 사전 요구사항

- Docker Desktop 4.x 이상 (그 외 로컬 설치 불필요 — JDK/Gradle/Node/PostgreSQL 전부 컨테이너에서 실행됨)

### 1. (선택) 환경 변수 설정

`.env` 파일 없이도 `docker compose up`만으로 DB 포함 전체 스택이 기본값으로 바로 기동됩니다.
GitHub 크롤링, AI 리포트 생성 등 외부 API를 쓰려면 아래처럼 `.env`를 설정하세요.

```bash
cp .env.example .env
```

`.env` 파일에서 아래 값을 실제 값으로 교체합니다.

```env
GITHUB_TOKEN=ghp_your_token_here
```

월간 리포트는 LLM 키 없이도 만들어집니다(기본 `LLM_PROVIDER=none`). GPT 해설이 필요해지면 아래 "월간 리포트와 AI(선택)"를 보세요.

### 실제 GitHub 데이터 수집하기

1. `.env`에 `GITHUB_TOKEN`을 넣고 **토큰이 동작하는지 점검한 뒤** 백엔드를 재시작합니다 (토큰 발급: GitHub → Settings → Developer settings → Personal access tokens, 공개 레포 읽기 권한이면 충분합니다).
   ```bash
   ./scripts/dev/check-github-token.sh   # 인증·한도·만료일·권한(repo 스코프 경고)·크롤러가 쓰는 API 호출을 점검, 토큰 값은 출력하지 않음
   ```

   curl 한 줄로만 확인하고 싶다면 (토큰을 명령에 직접 쓰지 말고 환경변수로):

   ```bash
   curl -s -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/rate_limit | grep -A3 '"core"'
   ```

   `"limit": 5000`이면 인증 성공, `60`이면 토큰이 적용되지 않은 것(비인증)이고, `401 Bad credentials`면 토큰이 틀렸거나 만료된 것입니다.
2. 샘플 데이터를 넣었다면 먼저 비웁니다 (`scripts/dev/clear-demo.sql`).
3. 크롤링을 시작합니다.

```bash
curl -X POST "http://localhost:8089/api/v1/crawl/trigger?domain=frontend"
```

- 도메인당 기본 30개 레포를 수집하며, 레포마다 GitHub API를 여러 번 호출해 몇 분이 걸립니다. 진행 상황은 백엔드 로그(`크롤링 완료`)로 확인하세요.
- **토큰이 없어도 동작은 하지만** 인증 없는 한도(core 60회/시간, search 10회/분)가 매우 낮습니다. 먼저 가볍게 시험하려면 `.env`에 `CRAWL_REPOS_PER_DOMAIN=3`을 두세요.
- **증가율은 두 달째부터 의미가 있습니다.** 첫 수집에는 비교할 지난달 데이터가 없어서, 홈은 "가장 많이 쓰이는 라이브러리"로 순위를 보여주고 목록의 증가율 칸에는 `New`가 표시됩니다.
- 이후에는 매일 03:00(KST)에 자동으로 갱신됩니다.

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

### 보안 / 커밋 전 확인

- `GITHUB_TOKEN`, `OPENAI_API_KEY`는 **`.env`에만** 두세요. `.env`, `frontend/.env.local`은 `.gitignore`에 등록돼 있어 커밋되지 않습니다. `.env.example`에는 자리표시자만 둡니다.
- 개인 설정(`.claude/settings.local.json`)도 추적하지 않습니다.
- 개발용 DB 포트(5433)는 `127.0.0.1`에만 열려 있습니다. 기본 비밀번호(`osstech_secret`)는 로컬 개발 전용이므로 **외부에 배포할 때는 `.env`의 `POSTGRES_PASSWORD`를 반드시 바꾸세요.**
- 커밋 전에 비밀값이 섞였는지 확인하려면:

```bash
git diff --cached | grep -nE 'ghp_[A-Za-z0-9]{20,}|github_pat_|sk-(ant-|proj-)?[A-Za-z0-9_-]{20,}' || echo "OK"
```

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

## 월간 리포트와 AI(선택)

`LLM_PROVIDER` 로 리포트 작성 방식을 고릅니다.

| 값 | 동작 | 필요한 것 |
|----|------|-----------|
| `none` (기본) | 집계 데이터에서 읽히는 사실(최다 사용, 급상승, 하락, 새로 늘어난 라이브러리)을 5개 섹션 마크다운으로 정리. 해석·예측은 쓰지 않음 | 없음 |
| `openai` | GPT가 기술적 맥락과 해설을 곁들여 작성 | `OPENAI_API_KEY` + 충전된 API 크레딧 |
| `claude` | Claude가 작성 | `CLAUDE_API_KEY` |

리포트는 매월 1일 전월 데이터로 자동 생성되고, 지금 만들려면 `POST /api/v1/reports/generate?domain=frontend&yearMonth=2026-11&lang=en` 을 호출합니다. 이미 만든 리포트는 다시 만들지 않으므로, 방식을 바꾼 뒤 새로 쓰려면 해당 월 리포트를 DB에서 지운 뒤 다시 생성하세요.

### OpenAI로 쓰고 싶을 때

`.env`에 `LLM_PROVIDER=openai` 와 `OPENAI_API_KEY` 를 넣고 백엔드를 다시 만듭니다 (`docker compose up -d --force-recreate backend`). 모델은 OpenAI **Responses API**(`POST /v1/responses`), 기본 `gpt-5-mini`입니다.

**1. API 키 발급과 결제 — ChatGPT 구독과는 별개입니다.**
ChatGPT Plus/Go 구독은 API 사용량을 포함하지 않습니다(OpenAI 문서상 API 크레딧 혜택은 Pro·Business 구독 한정). API는 <https://platform.openai.com> 에서 키를 발급하고 **크레딧을 충전**해야 쓸 수 있으며, 크레딧이 없으면 `429 credit_balance_exhausted` 로 실패합니다.

**2. 지출 한도부터 설정하세요.** Organization → Limits → Spend → *Edit spend limit* 에서 월 한도를 정하고 *Enforce a hard limit* 을 켜면 한도 도달 시 호출이 막혀 요금이 더 나오지 않습니다 (알림만 보내는 *spend alert* 와는 다릅니다).

**3. 키를 `.env`에 넣고 점검합니다.**

```bash
./scripts/dev/check-openai-key.sh          # 키 유효성 + 모델 사용 가능 여부 (무료)
./scripts/dev/check-openai-key.sh --ping   # 아주 작은 실제 호출로 크레딧까지 확인 (1센트 미만)
```

**비용 감각.** 리포트는 월 12번(도메인 6개 × 영어·한국어) 생성되고 이미 만든 리포트는 다시 만들지 않습니다. 한 번에 입력 약 1.5K·출력 약 2.5K 토큰으로 어림하면 `gpt-5-mini` 기준 월 몇십 센트 이하입니다. 추론(reasoning) 토큰도 출력으로 과금되니 더 줄이려면 `OPENAI_REASONING_EFFORT=low`(모델마다 지원 값이 다름)나 더 작은 모델(`OPENAI_MODEL`)을 쓰세요. 최신 단가는 <https://developers.openai.com/api/docs/pricing> 에서 확인하세요.

**제공자 전환.** `.env`의 `LLM_PROVIDER=claude`(+ `CLAUDE_API_KEY`) 또는 `none` 으로 바꿀 수 있습니다.

**키가 없을 때.** `LLM_PROVIDER=openai` 인데 키가 없으면 리포트 생성 API가 `503 LLM_UNAVAILABLE` 과 함께 원인·해결 방법을 알려줍니다. 크롤링과 화면 조회는 AI 키와 무관하게 동작합니다.

## 다국어 (English / 한국어)

| 항목 | 영어 (기본) | 한국어 |
|------|-------------|--------|
| URL | `/libraries` | `/ko/libraries` |
| 번역 파일 | `frontend/messages/en.json` | `frontend/messages/ko.json` |
| 월간 리포트 | `lang=en` | `lang=ko` |

- **`/`는 항상 영어입니다.** 브라우저 언어나 쿠키로 자동 이동하지 않습니다(`localeDetection: false`). 한국어는 `/ko`로 직접 들어가거나 헤더의 언어 버튼으로 전환합니다.
  브라우저 언어에 따라 자동으로 `/ko`로 보내고 싶다면 `frontend/src/i18n/routing.ts`에서 `localeDetection: false`를 지우세요.
- 새 문구는 **두 파일에 같은 키**로 추가합니다. 날짜·숫자 형식은 로케일에 맞춰 자동으로 바뀝니다.
- 검색 노출용 `hreflang`/canonical 은 페이지마다 자동 생성됩니다. 배포 시 `.env`의 `SITE_URL`(예: `https://example.com`)을 실제 주소로 설정하세요 (런타임 변수라 이미지 재빌드가 필요 없습니다).
- 월간 리포트는 영어·한국어를 각각 생성합니다 (기본은 템플릿이라 키 불필요, GPT 사용은 아래 "월간 리포트와 AI" 참고). 요청한 언어의 리포트가 없으면 다른 언어로 보여주고 안내 문구를 표시합니다.

## 크롤러가 읽는 것

레포 루트의 파일 목록을 **한 번** 조회해서, 실제로 있는 의존성 파일만 읽습니다 (없는 파일을 하나씩 찔러보지 않아 레포당 호출이 적습니다).

| 생태계 | 파일 |
|--------|------|
| JavaScript / TypeScript | `package.json` |
| Python | `requirements.txt`, `pyproject.toml` (PEP 621, Poetry) |
| Go | `go.mod` (직접 의존성만, `// indirect` 제외) |
| Rust | `Cargo.toml` |
| Java / Kotlin | `pom.xml`, `build.gradle`, `build.gradle.kts` |
| Dart / Flutter | `pubspec.yaml` |
| PHP | `composer.json` |
| Ruby | `Gemfile` |

- 루트 파일만 읽습니다. 모노레포 하위 폴더의 의존성은 포함되지 않습니다.
- 파서를 더하려면 `crawler/parser/`에 `DependencyParser` 구현을 추가하고 `FileType`과 `CrawlerService`의 후보 목록에 등록하세요.
- **목록·문서형 레포는 제외합니다.** `awesome-*`, 인터뷰/로드맵/치트시트/인턴십 목록처럼 소프트웨어가 아닌 레포는 스타와 커밋이 많아 "가장 활발한 프로젝트"를 왜곡하기 때문에 이름 규칙(`CrawlDomains.isCuratedList`)으로 건너뛰고, 그만큼 더 받아 와서 분야당 목표 개수를 채웁니다. 이름 규칙이라 완벽하지 않습니다.
- 같은 레포가 여러 토픽에 걸리면(예: frontend + mobile) 분야마다 따로 저장하고, 전체 대시보드의 합계·순위에서는 한 번만 셉니다.

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
