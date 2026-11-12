-- 개발용 샘플 데이터 (GITHUB_TOKEN 없이 UI/API 확인용). 가상의 레포/라이브러리입니다.
-- 실제 크롤링 전에는 clear-demo.sql 로 비워주세요.
BEGIN;

-- 1) 레포지토리
INSERT INTO github_repositories (owner, name, domain, stars, forks, language, last_pushed_at)
SELECT owner, name, domain, stars, forks, language, now() - (pushed_days || ' days')::interval
FROM (VALUES
  ('demo-labs','fluxui','frontend',48210,3120,'TypeScript',0),
  ('demo-labs','pixel-kit','frontend',31950,2210,'TypeScript',1),
  ('northwind','signal-state','frontend',22480,980,'TypeScript',0),
  ('northwind','vite-forge','frontend',18740,1430,'JavaScript',2),
  ('acme-web','islands','frontend',12900,610,'TypeScript',1),
  ('acme-web','motion-lite','frontend',9420,380,'TypeScript',6),
  ('kite-dev','svelte-orbit','frontend',7810,420,'Svelte',3),
  ('kite-dev','css-atoms','frontend',4390,190,'CSS',12),
  ('demo-labs','springline','backend',41300,5100,'Kotlin',0),
  ('northwind','axum-kit','backend',27600,1500,'Rust',1),
  ('acme-web','fastlane-api','backend',24100,2300,'Python',0),
  ('kite-dev','go-mesh','backend',16880,1210,'Go',2),
  ('acme-web','nest-pilot','backend',11200,890,'TypeScript',4),
  ('demo-labs','orm-lite','backend',6940,310,'Java',9),
  ('northwind','kubeflow-lens','devops',35400,4200,'Go',0),
  ('acme-web','tf-compose','devops',19800,2100,'HCL',1),
  ('kite-dev','ci-runner','devops',9300,520,'Rust',3),
  ('demo-labs','swift-canvas','mobile',21700,1800,'Swift',1),
  ('northwind','compose-motion','mobile',15400,990,'Kotlin',0),
  ('kite-dev','flutter-forms','mobile',8200,640,'Dart',5),
  ('acme-web','tensor-notes','data',52800,7300,'Python',0),
  ('demo-labs','vector-store','data',26100,2400,'Rust',1),
  ('northwind','dataframe-x','data',14900,1100,'Python',2),
  ('kite-dev','vuln-scan','security',17300,1600,'Go',0),
  ('acme-web','secret-guard','security',10800,740,'Python',2)
) AS t(owner,name,domain,stars,forks,language,pushed_days);

-- 2) Active Level 점수 (README 공식과 동일)
INSERT INTO active_level_scores (repository_id, score, commits_30d, prs_merged_30d, issues_closed_30d, calculated_at)
SELECT id,
       (c*3 + p*2 + i)::float / GREATEST(ln(stars + 1), 1.0),
       c, p, i, now()
FROM (
  SELECT id, stars,
         (1 + (abs(hashtext(name)) % 120) * (abs(hashtext(name || 'm')) % 4))::int AS c,
         (1 + (abs(hashtext(owner || name)) % 35))::int AS p,
         (1 + (abs(hashtext(name || owner)) % 45))::int AS i
  FROM github_repositories
) s;

-- 3) 라이브러리 6개월 사용량 + 전월 대비 증감률
INSERT INTO library_usages (library_name, domain, collected_month, usage_count, prev_month_count, growth_rate)
SELECT lib, domain, month, cnt, COALESCE(prev, 0),
       CASE WHEN COALESCE(prev,0) = 0 THEN 100.0
            ELSE (cnt - prev)::float / prev * 100.0 END
FROM (
  SELECT lib, domain, month, cnt,
         lag(cnt) OVER (PARTITION BY domain, lib ORDER BY month) AS prev
  FROM (
    SELECT b.lib, b.domain,
           (date '2026-11-01' - make_interval(months => 5 - m.i))::date AS month,
           GREATEST(1, round(b.start + b.slope * m.i + (abs(hashtext(b.lib || m.i)) % 3)))::int AS cnt
    FROM (VALUES
      ('react','frontend',22,1.2),('next','frontend',9,2.4),('typescript','frontend',20,0.8),
      ('tailwindcss','frontend',11,1.6),('vite','frontend',8,1.9),('zustand','frontend',3,1.5),
      ('@tanstack/react-query','frontend',6,1.3),('zod','frontend',4,1.7),('svelte','frontend',5,0.4),('jquery','frontend',9,-1.1),
      ('org.springframework.boot:spring-boot-starter-web','backend',18,0.6),
      ('org.jetbrains.kotlin:kotlin-reflect','backend',9,1.4),('fastapi','backend',7,1.8),
      ('express','backend',14,-0.5),('org.postgresql:postgresql','backend',16,0.7),
      ('sqlalchemy','backend',6,0.9),('gin','backend',3,1.1),('axum','backend',2,1.6),
      ('terraform-provider-aws','devops',10,0.8),('helm','devops',8,1.0),('pulumi','devops',2,1.3),
      ('torch','data',14,0.9),('pandas','data',18,0.2),('polars','data',3,2.0),('langchain','data',4,1.8)
    ) AS b(lib, domain, start, slope)
    CROSS JOIN generate_series(0, 5) AS m(i)
  ) x
) y;

-- 4) 월간 리포트 샘플 (frontend, 영어/한국어)
INSERT INTO monthly_reports (domain, report_month, language, content, generated_at)
VALUES
('frontend', date '2026-10-01', 'en', E'## One-line summary\nSignals and server-first rendering keep pulling teams away from heavyweight client state.\n\n## Top 3 rising libraries\n1. **zustand** — minimal global state with almost no boilerplate.\n2. **vite** — the default dev server for new projects.\n3. **zod** — runtime validation that pairs naturally with TypeScript.\n\n## Full ranking\n| # | Library | Repos |\n|---|---------|-------|\n| 1 | react | 26 |\n| 2 | typescript | 22 |\n| 3 | next | 15 |\n\n## Changes worth watching\n`jquery` keeps declining as legacy projects migrate.\n\n## Next month outlook\nExpect **server components** and **signals** to dominate the conversation.', now()),
('frontend', date '2026-10-01', 'ko', E'## 이번 달 한 줄 요약\n시그널과 서버 우선 렌더링이 무거운 클라이언트 상태 관리에서 팀들을 계속 이탈시키고 있습니다.\n\n## 급상승 라이브러리 TOP 3\n1. **zustand** — 보일러플레이트가 거의 없는 전역 상태 관리\n2. **vite** — 신규 프로젝트의 기본 개발 서버\n3. **zod** — TypeScript와 잘 어울리는 런타임 검증\n\n## 전체 순위표\n| # | 라이브러리 | 레포 수 |\n|---|-----------|--------|\n| 1 | react | 26 |\n| 2 | typescript | 22 |\n| 3 | next | 15 |\n\n## 주의 깊게 볼 변화\n레거시 프로젝트가 이전하면서 `jquery`는 계속 하락 중입니다.\n\n## 다음 달 예측\n**서버 컴포넌트**와 **시그널**이 화두가 될 전망입니다.', now());

COMMIT;
