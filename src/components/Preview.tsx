import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
              const match = /language-(\w+)/.exec(className || '');
              const language = match?.[1];
              const text = String(children).replace(/\n$/, '');

              if (!language) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              return (
                <SyntaxHighlighter
                  style={atomDark}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    borderRadius: '0.5rem',
                    margin: 0,
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d'
                  }}
                >
                  {text}
                </SyntaxHighlighter>
              );
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
