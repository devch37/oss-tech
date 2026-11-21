'use client';

import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  /** 스크린리더용 그룹 이름 (예: "Rank by") */
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** 보기 방식을 바꾸는 작은 토글. 버튼 그룹이며 현재 선택은 aria-pressed 로 알린다. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex rounded-lg border border-border bg-muted/60 p-0.5 text-sm', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              option.disabled && 'cursor-not-allowed opacity-50 hover:text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
