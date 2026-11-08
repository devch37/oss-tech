import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, CalendarClock, FileSearch, GitBranch, Package, Sparkles } from 'lucide-react';
import { DOMAINS } from '@/lib/domains';
import { cn, getScoreGradeColor, GRADE_INFO, type ScoreGrade } from '@/lib/utils';
import { PageHeader, SectionTitle } from '@/components/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = { title: '이용 가이드' };

const STEPS = [
  { icon: GitBranch, title: '1. 인기 프로젝트 수집', body: '분야별 GitHub 토픽에서 Star 가 많은 프로젝트 30개를 매일 가져와요.' },
  { icon: FileSearch, title: '2. 의존성 분석', body: 'package.json · build.gradle(.kts) · pom.xml · requirements.txt 를 읽어 어떤 라이브러리를 쓰는지 확인해요.' },
  { icon: Activity, title: '3. 활성도 계산', body: '최근 30일 커밋 · 병합된 PR · 닫힌 이슈 수로 프로젝트가 얼마나 살아있는지 점수화해요.' },
  { icon: Sparkles, title: '4. AI 리포트', body: '한 달 데이터를 Claude AI 가 읽고 트렌드를 글로 정리해요.' },
];

const METRICS = [
  { term: '사용 프로젝트 수', def: '이번 달 분석한 프로젝트 중 그 라이브러리를 의존성으로 가진 프로젝트 수.', ex: 'react 가 30개 중 21개 프로젝트에 있으면 21' },
  { term: '채택률', def: '사용 프로젝트 수 ÷ 분석한 전체 프로젝트 수. 이 분야에서 얼마나 “표준”인지.', ex: '21 ÷ 30 = 70%' },
  { term: '지난달 대비', def: '(이번 달 − 지난달) ÷ 지난달 × 100. 지난달 0개였다면 NEW.', ex: '10개 → 13개면 +30%' },
  { term: '활성도 점수', def: '(커밋×3 + 병합 PR×2 + 닫힌 이슈×1) ÷ ln(Star+1). 큰 프로젝트일수록 보정돼요.', ex: '커밋 100, PR 40, 이슈 30, Star 10k → 약 39점 (A)' },
];

const FAQ = [
  { q: '데이터는 언제 업데이트되나요?', a: '매일 새벽 3시(KST)에 GitHub 수집이 자동 실행되고, 매월 1일 오전 9시에 AI 리포트가 발행돼요.' },
  { q: '월초에 데이터가 적어 보여요.', a: '이번 달 데이터가 아직 없으면 데이터가 있는 가장 최근 달을 자동으로 보여줘요. 라이브러리 랭킹에서 기준월을 바꿀 수 있어요.' },
  { q: '왜 30개 프로젝트만 분석하나요?', a: 'GitHub API 호출 한도 안에서 매일 안정적으로 수집하기 위해서예요. 각 분야의 대표 프로젝트를 표본으로 삼아 흐름을 봅니다.' },
  { q: '필터 상태를 다른 사람과 공유할 수 있나요?', a: '네. 분야·검색어·정렬·필터가 모두 주소(URL)에 저장되므로 주소창 링크를 그대로 공유하면 같은 화면이 열려요.' },
  { q: '빠르게 찾는 방법이 있나요?', a: '어느 화면에서든 ⌘K(Windows: Ctrl+K) 또는 / 키를 누르면 빠른 검색이 열려요.' },
];

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<span>도움말</span>}
        title="이용 가이드"
        description="Tech-Radar 는 GitHub 인기 오픈소스 프로젝트를 매일 분석해 “요즘 무엇이 뜨고 있는지” 를 보여주는 서비스예요. 숫자가 어떻게 만들어지는지 알아두면 더 잘 읽을 수 있어요."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border bg-card p-5 shadow-soft">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <SectionTitle icon="📐" title="지표 읽는 법" />
          </CardHeader>
          <CardContent className="divide-y">
            {METRICS.map((m) => (
              <div key={m.term} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold">{m.term}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{m.def}</p>
                <p className="mt-1 inline-block rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  예) {m.ex}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <SectionTitle icon="🏅" title="활성도 등급" description="최근 30일 기준" />
          </CardHeader>
          <CardContent className="space-y-2">
            {(['S', 'A', 'B', 'C'] as ScoreGrade[]).map((g) => (
              <div key={g} className="flex items-center gap-3 rounded-xl border p-3">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-base font-black ring-1 ring-inset', getScoreGradeColor(g))}>
                  {g}
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {GRADE_INFO[g].label} <span className="font-normal text-muted-foreground">· {GRADE_INFO[g].range}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{GRADE_INFO[g].hint}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <SectionTitle icon="🗂️" title="분야 구분" description="각 분야는 GitHub 토픽으로 프로젝트를 찾아요" />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((d) => {
            const Icon = d.icon;
            return (
              <Link
                key={d.value}
                href={`/?domain=${d.value}`}
                className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white', d.gradient)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{d.label}</span>
                  <span className="block text-xs text-muted-foreground">{d.description}</span>
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle icon="💬" title="자주 묻는 질문" />
        </CardHeader>
        <CardContent className="space-y-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border px-4 py-3 open:bg-muted/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
                {f.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" /> 매일 03:00 수집 · 매월 1일 09:00 리포트 발행 (KST)
        <Package className="ml-2 h-3.5 w-3.5" /> 의존성 파일 5종 분석
      </p>
    </div>
  );
}
