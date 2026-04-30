# OSS Tech-Radar

GitHub OSS 트렌드를 자동 수집·분석하고, Claude AI로 월간 리포트를 생성하는 풀스택 대시보드.

```
┌─────────────────────────────────────────────────────┐
│  GitHub API  →  Crawler  →  PostgreSQL              │
│                    ↓                                 │
│           DependencyParser (5종)                    │
│           ActiveLevelCalculator                     │
│                    ↓                                 │
│         Claude API  →  MonthlyReport               │
│                    ↓                                 │
│     Next.js 14 Dashboard (SSR + Recharts)           │
└─────────────────────────────────────────────────────┘
```

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Backend | Kotlin 1.9 · Spring Boot 3.3 · Spring WebFlux · JPA |
| Database | PostgreSQL 16 · Flyway 10 |
| AI | Claude API (claude-sonnet-4-6) |
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts |
| Infra | Docker · Docker Compose |

## 프로젝트 구조

```
oss-tech/
├── backend/                   # Spring Boot 애플리케이션
│   ├── src/main/kotlin/
│   │   ├── api/               # REST 컨트롤러 (7개 엔드포인트)
│   │   ├── claude/            # Claude API 연동 + 리포트 생성
│   │   ├── config/            # WebClient, CORS 설정
│   │   ├── domain/            # JPA 엔티티 (5개)
│   │   └── repository/        # Spring Data JPA
│   └── src/main/resources/
│       └── db/migration/      # Flyway 마이그레이션
├── frontend/                  # Next.js 14 애플리케이션
│   └── src/
│       ├── app/               # App Router 페이지
│       │   ├── page.tsx       # 메인 대시보드
│       │   ├── libraries/     # 라이브러리 순위 + 트렌드
│       │   ├── repositories/  # 레포지토리 목록
│       │   └── reports/       # AI 월간 리포트
│       ├── components/        # 공통 컴포넌트 + Recharts 래퍼
│       ├── lib/               # API 클라이언트 + 유틸리티
│       └── types/             # TypeScript 타입 정의
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
| GET | `/api/v1/libraries/{name}/trend` | 라이브러리 6개월 트렌드 |
| GET | `/api/v1/reports` | AI 리포트 목록 (도메인별) |
| GET | `/api/v1/reports/{id}` | AI 리포트 상세 (Markdown) |
| POST | `/api/v1/reports/generate` | AI 리포트 수동 생성 |
| POST | `/api/v1/crawl/trigger` | GitHub 크롤링 수동 트리거 |

Swagger UI: `http://localhost:8080/swagger-ui.html`

## 실행 방법

### 사전 요구사항

- Docker Desktop 4.x 이상
- GitHub Personal Access Token (repo 읽기 권한)
- Anthropic API Key

### 1. 환경 변수 설정

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
| 대시보드 | http://localhost:3000 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| API 기본 | http://localhost:8080/api/v1 |
| PostgreSQL | localhost:5432 (DB: osstech) |

### 로컬 개발 (Docker 없이)

**Backend**

```bash
# PostgreSQL이 로컬에서 실행 중이어야 함
cd backend
./gradlew bootRun
```

**Frontend**

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

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

# 프론트엔드 타입 검사
cd frontend && npm run type-check

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
| 매월 1일 09:00 KST | 전 도메인 AI 월간 리포트 자동 생성 |

수동 생성: `POST /api/v1/reports/generate?domain=frontend&yearMonth=2026-04`
