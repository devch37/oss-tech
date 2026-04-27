'use client';

import { useDomain } from '@/contexts/DomainContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DOMAINS = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'devops', label: 'DevOps' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'data', label: 'Data / ML' },
  { value: 'security', label: 'Security' },
];

interface DomainSelectorProps {
  className?: string;
}

export function DomainSelector({ className }: DomainSelectorProps) {
  const { selectedDomain, setSelectedDomain } = useDomain();

  return (
    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
      <SelectTrigger className={className ?? 'w-[160px]'}>
        <SelectValue placeholder="도메인 선택" />
      </SelectTrigger>
      <SelectContent>
        {DOMAINS.map((d) => (
          <SelectItem key={d.value} value={d.value}>
            {d.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
