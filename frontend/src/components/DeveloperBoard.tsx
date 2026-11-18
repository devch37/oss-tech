'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCompact } from '@/lib/utils';
import type { RisingDeveloper, TopDeveloper } from '@/types/api';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { SegmentedControl } from '@/components/SegmentedControl';

type View = 'rising' | 'followed';

interface DeveloperBoardProps {
  rising: RisingDeveloper[];
  followed: TopDeveloper[];
  limit?: number;
}

function ProfileLink({ login, children }: { login: string; children: React.ReactNode }) {
  const tc = useTranslations('common');
  return (
    <a
      href={`https://github.com/${login}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex max-w-full items-center after:absolute after:inset-0 after:rounded-[inherit]"
    >
      <span className="break-words group-hover:underline group-hover:underline-offset-4">{children}</span>
      <span className="sr-only">
        {tc('viewOnGithub', { name: login })} ({tc('opensInNewTab')})
      </span>
    </a>
  );
}

/** 사람·팀 — 큰 프로필 사진과 한 줄 설명. "뜨는 프로젝트를 만든 사람"과 "팔로워 많은 순"을 토글로 바꾼다. */
export function DeveloperBoard({ rising, followed, limit = 8 }: DeveloperBoardProps) {
  const t = useTranslations('trends.developers');
  const locale = useLocale();
  const [view, setView] = useState<View>('rising');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-medium">{t('viewBy')}</span>
        <SegmentedControl<View>
          label={t('viewBy')}
          value={view}
          onChange={setView}
          options={[
            { value: 'rising', label: t('rising') },
            { value: 'followed', label: t('followed') },
          ]}
        />
      </div>

      {view === 'rising' ? (
        rising.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-base text-muted-foreground">{t('empty')}</p>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-2">
            {rising.slice(0, limit).map((dev, i) => (
              <li key={dev.login} className="relative flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/40 focus-within:border-foreground/40">
                <OwnerAvatar login={dev.login} size={64} />
                <div className="min-w-0 space-y-1">
                  <p className="font-display text-xl font-semibold leading-tight">
                    <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}</span>
                    <ProfileLink login={dev.login}>{dev.login}</ProfileLink>
                  </p>
                  <p className="text-sm font-medium text-signal-ink">{dev.ownerType === 'Organization' ? t('team') : t('person')}</p>
                  <p className="text-base text-muted-foreground">
                    {t('hotProjects', { count: dev.repoCount })}, {t('starsTotal', { count: formatCompact(dev.totalStars, locale) })}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{dev.topRepo.name}</p>
                </div>
              </li>
            ))}
          </ol>
        )
      ) : followed.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-base text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          <ol className="grid gap-4 sm:grid-cols-2">
            {followed.slice(0, limit).map((dev, i) => (
              <li key={dev.login} className="relative flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/40 focus-within:border-foreground/40">
                <OwnerAvatar login={dev.login} size={64} />
                <div className="min-w-0 space-y-1">
                  <p className="font-display text-xl font-semibold leading-tight">
                    <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}</span>
                    <ProfileLink login={dev.login}>{dev.name ?? dev.login}</ProfileLink>
                  </p>
                  {dev.name && <p className="text-sm text-muted-foreground">{dev.login}</p>}
                  <p className="text-base font-medium">{t('followers', { count: formatCompact(dev.followers, locale) })}</p>
                  {dev.bio && <p className="line-clamp-2 text-sm text-muted-foreground">{dev.bio}</p>}
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground">{t('followersHelp')}</p>
        </>
      )}
    </div>
  );
}
