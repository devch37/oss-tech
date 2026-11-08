'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { generateReport, triggerCrawl } from '@/lib/api-client';

type Status = 'idle' | 'loading' | 'done' | 'error';

/** GitHub 데이터 수집 즉시 실행 (백그라운드 처리) */
export function CrawlButton({ domain, ...props }: { domain: string } & ButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setStatus('loading');
    setMessage(null);
    try {
      await triggerCrawl(domain);
      setStatus('done');
      setMessage('수집을 시작했어요. 몇 분 뒤 새로고침하면 결과가 보여요.');
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : '요청에 실패했어요.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={run} disabled={status === 'loading' || status === 'done'} {...props}>
        {status === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'done' ? (
          <Check className="h-4 w-4" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {status === 'done' ? '수집 요청 완료' : '지금 데이터 수집하기'}
      </Button>
      {message && (
        <p className={status === 'error' ? 'text-xs text-danger' : 'text-xs text-muted-foreground'}>{message}</p>
      )}
    </div>
  );
}

/** Claude AI 월간 리포트 생성 (수십 초 소요) */
export function GenerateReportButton({
  domain,
  yearMonth,
  ...props
}: { domain: string; yearMonth: string } & ButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setStatus('loading');
    setMessage('AI 가 리포트를 작성하는 중이에요… (30초~1분)');
    try {
      const report = await generateReport(domain, yearMonth);
      setStatus('done');
      router.push(`/reports/${report.id}`);
    } catch (e) {
      setStatus('error');
      setMessage(
        e instanceof Error
          ? `${e.message} — CLAUDE_API_KEY 설정과 수집 데이터 여부를 확인해 주세요.`
          : '리포트 생성에 실패했어요.',
      );
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={run} disabled={status === 'loading'} {...props}>
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        AI 리포트 만들기
      </Button>
      {message && (
        <p className={status === 'error' ? 'max-w-sm text-center text-xs text-danger' : 'text-xs text-muted-foreground'}>
          {message}
        </p>
      )}
    </div>
  );
}
