'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ShareButton({ className }: { className?: string }) {
  const t = useTranslations('reportDetail');
  const [copied, setCopied] = useState(false);

  const flash = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard API 미지원 환경 fallback
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    flash();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className={className}>
      {copied ? (
        <>
          <Check className="mr-1.5 h-3.5 w-3.5 text-sea" aria-hidden="true" />
          <span role="status">{t('copied')}</span>
        </>
      ) : (
        <>
          <Link2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('share')}
        </>
      )}
    </Button>
  );
}
