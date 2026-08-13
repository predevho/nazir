import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** 관리자 작성 마크다운을 다크 테마에 맞게 렌더. 빈 값이면 null. */
export function MarkdownText({ children, className }: { children: string; className?: string }) {
  if (!children || !children.trim()) return null;
  return (
    <div
      className={`[&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:marker:text-gold/50 [&_a]:text-gold [&_a]:underline [&_strong]:font-medium [&_strong]:text-paper [&_em]:italic ${className ?? ''}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
