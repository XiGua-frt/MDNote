import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import Prism from '../prism-loader';
import { formatMarkdownSource } from '../utils/formatMarkdownSource';
import { coercePrismLanguage, resolvePrismLanguage } from '../utils/resolvePrismLanguage';

function renderHighlightedCodeBlock(text: string, canonicalLanguage: string, className?: string) {
  try {
    const language = coercePrismLanguage(canonicalLanguage);
    const grammar =
      (Prism.languages[language as keyof typeof Prism.languages] as (typeof Prism)['languages']['markup'] | undefined) ??
      Prism.languages.markup;
    if (!grammar) {
      throw new Error('Prism markup grammar unavailable');
    }
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

const markdownPlugins = [remarkGfm, remarkBreaks] as const;
const rehypePlugins = [rehypeRaw] as const;

const markdownComponents: Components = {
  table({ children, ...props }) {
    return (
      <div style={{ display: 'block' }} className="my-6 w-full max-w-full overflow-x-auto">
        <table {...props}>{children}</table>
      </div>
    );
  },
  code({ className, children, ...props }) {
    const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '');
    const text = String(children).replace(/\n$/, '');

    if (!text.trim() || !match?.[1]) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return renderHighlightedCodeBlock(text, resolvePrismLanguage(match[1]), className);
  }
};

interface PreviewProps {
  content: string;
  zenMode?: boolean;
}

function Preview({ content, zenMode = false }: PreviewProps) {
  const [copyLabel, setCopyLabel] = useState<string>('复制');
  const markdownForPreview = useMemo(() => formatMarkdownSource(content), [content]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('[MDNote][Preview] formatMarkdownSource → react-markdown input:\n', markdownForPreview);
  }, [markdownForPreview]);

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
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-10 md:px-12 lg:px-20">
        <article className="prose prose-base md:prose-lg prose-invert mx-auto w-full max-w-5xl overflow-x-auto rounded-[28px] border border-[#202833] bg-[#070c12] p-6 md:p-8">
          <ReactMarkdown
            remarkPlugins={[...markdownPlugins]}
            rehypePlugins={[...rehypePlugins]}
            components={markdownComponents}
          >
            {markdownForPreview}
          </ReactMarkdown>
        </article>
      </div>
    </section>
  );
}

export default Preview;
