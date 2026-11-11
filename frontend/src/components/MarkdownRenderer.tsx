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
          'prose prose-slate max-w-none dark:prose-invert',
          // 본문은 읽기 편한 줄 길이로 제한
          'prose-p:max-w-[68ch] prose-li:max-w-[68ch] prose-p:leading-relaxed',
          // 제목은 디스플레이 서체
          'prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight',
          'prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl',
          // 코드
          'prose-code:before:content-none prose-code:after:content-none',
          'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-medium prose-code:text-foreground',
          'prose-pre:overflow-hidden prose-pre:rounded-lg prose-pre:bg-transparent prose-pre:p-0',
          // 링크
          'prose-a:font-medium prose-a:text-sea prose-a:underline-offset-4',
          // 표
          'prose-table:block prose-table:overflow-x-auto prose-th:text-left prose-th:font-semibold',
          // 인용/강조
          'prose-strong:font-semibold prose-strong:text-foreground',
        ].join(' ')
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
