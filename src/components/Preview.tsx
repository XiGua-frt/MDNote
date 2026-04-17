import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/themes/prism-tomorrow.css';

if (typeof window !== 'undefined') {
  (window as Window & { Prism?: typeof Prism }).Prism = Prism;
}

function resolveLanguage(rawLanguage?: string): string {
  if (!rawLanguage) {
    return 'text';
  }
  const normalized = rawLanguage.toLowerCase();
  if (normalized === 'md') return 'markdown';
  if (normalized === 'js') return 'javascript';
  if (normalized === 'ts') return 'typescript';
  if (normalized === 'py') return 'python';
  if (normalized === 'sh') return 'bash';
  if (normalized === 'yml') return 'yaml';
  return normalized;
}

function renderHighlightedCodeBlock(text: string, language: string, className?: string) {
  const grammar =
    Prism.languages[language as keyof typeof Prism.languages] ?? Prism.languages.markup;

  try {
    const html = Prism.highlight(text, grammar, language);
    return (
      <pre className={className}>
        <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    );
  } catch (error) {
    console.error('Prism highlight failed:', error);
    return (
      <pre className={className}>
        <code>{text}</code>
      </pre>
    );
  }
}

interface PreviewProps {
  content: string;
  zenMode?: boolean;
}

function Preview({ content, zenMode = false }: PreviewProps) {
  const [copyLabel, setCopyLabel] = useState<string>('复制');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyLabel('已复制');
      window.setTimeout(() => setCopyLabel('复制'), 1200);
    } catch (error) {
      console.error('Copy failed', error);
      setCopyLabel('失败');
      window.setTimeout(() => setCopyLabel('复制'), 1200);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#0d1117]">
      <div className="flex items-center justify-between gap-3 border-b border-[#202833] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
            {zenMode ? 'Zen Preview' : '实时预览'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">同步查看 Markdown 输出与代码高亮效果</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-[#30363d] bg-slate-950 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          {copyLabel}
        </button>
      </div>
      <div className="min-h-0 flex-1 px-5 py-5">
        <article className="prose prose-invert h-full max-w-none overflow-y-auto rounded-[28px] border border-[#202833] bg-[#070c12] p-5">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '');
              const language = resolveLanguage(match?.[1]);
              const text = String(children).replace(/\n$/, '');

              if (!text.trim() || !match?.[1]) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              return renderHighlightedCodeBlock(text, language, className);
            }
          }}
        >
          {content}
        </ReactMarkdown>
        </article>
      </div>
    </section>
  );
}

export default Preview;
