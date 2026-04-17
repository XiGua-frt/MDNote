import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import clike from 'react-syntax-highlighter/dist/esm/languages/prism/clike';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const registeredLanguages = new Set<string>();

function registerLanguage(name: string, grammar: unknown) {
  if (registeredLanguages.has(name)) {
    return;
  }
  SyntaxHighlighter.registerLanguage(name, grammar);
  registeredLanguages.add(name);
}

registerLanguage('markdown', markdown);
registerLanguage('md', markdown);
registerLanguage('markup', markup);
registerLanguage('html', markup);
registerLanguage('xml', markup);
registerLanguage('css', css);
registerLanguage('clike', clike);
registerLanguage('javascript', javascript);
registerLanguage('js', javascript);
registerLanguage('jsx', jsx);
registerLanguage('typescript', typescript);
registerLanguage('ts', typescript);
registerLanguage('tsx', tsx);
registerLanguage('json', json);
registerLanguage('bash', bash);
registerLanguage('sh', bash);
registerLanguage('python', python);
registerLanguage('py', python);
registerLanguage('sql', sql);
registerLanguage('yaml', yaml);
registerLanguage('yml', yaml);

const languageAliasMap: Record<string, string> = {
  md: 'markdown',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  yml: 'yaml'
};

function resolveLanguage(rawLanguage?: string): string | null {
  if (!rawLanguage) {
    return null;
  }
  const normalized = rawLanguage.toLowerCase();
  const mapped = languageAliasMap[normalized] ?? normalized;
  return registeredLanguages.has(mapped) ? mapped : null;
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

              if (!language || !text.trim()) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              try {
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
              } catch (error) {
                console.error('Syntax highlight render failed:', error);
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
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
