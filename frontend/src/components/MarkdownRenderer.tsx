// highlight.js 라이트 테마 — Next.js가 번들에 포함, 다크 오버라이드는 globals.css
import 'highlight.js/styles/github.css';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={
        className ??
        [
          'prose prose-slate dark:prose-invert max-w-none',
          // 코드 블록 스타일
          'prose-code:before:content-none prose-code:after:content-none',
          'prose-code:rounded prose-code:px-1.5 prose-code:py-0.5',
          'prose-code:bg-muted prose-code:text-foreground prose-code:font-mono prose-code:text-sm',
          // pre 블록 스타일 (highlight.js가 배경 지정하므로 prose 기본값 제거)
          'prose-pre:p-0 prose-pre:bg-transparent prose-pre:rounded-xl prose-pre:overflow-hidden',
          // 링크
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          // 테이블
          'prose-table:block prose-table:overflow-x-auto',
        ].join(' ')
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
