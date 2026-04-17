import { useMemo, useRef, useState } from 'react';
import { fileOpen } from 'browser-fs-access';
import { Download, FileUp } from 'lucide-react';
import CodeEditor from 'react-simple-code-editor';
import Prism from 'prismjs';
import ReactMarkdown from 'react-markdown';
import { useReactToPrint } from 'react-to-print';
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
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';

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

type WorkspaceMode = 'edit' | 'read';

interface LiveMarkdownWorkspaceProps {
  noteTitle: string;
  value: string;
  onChange: (value: string) => void;
  onImportContent: (content: string, fileName?: string) => void;
  zenMode?: boolean;
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="m4 20 4.5-1 9.8-9.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
      <path d="m13.5 7.5 3 3" />
    </svg>
  );
}

function ReadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4.5 5.5h15v13h-15z" />
      <path d="M8 10h8M8 14h6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function LiveMarkdownWorkspace({
  noteTitle,
  value,
  onChange,
  onImportContent,
  zenMode = false
}: LiveMarkdownWorkspaceProps) {
  const [mode, setMode] = useState<WorkspaceMode>('edit');
  const [copyLabel, setCopyLabel] = useState<string>('复制');
  const printRef = useRef<HTMLElement | null>(null);

  const stats = useMemo(() => {
    const lines = value.length === 0 ? 1 : value.split('\n').length;
    const characters = value.replace(/\n/g, '').length;
    const words = value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;
    return { lines, characters, words };
  }, [value]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyLabel('已复制');
      window.setTimeout(() => setCopyLabel('复制'), 1200);
    } catch (error) {
      console.error('Copy failed', error);
      setCopyLabel('失败');
      window.setTimeout(() => setCopyLabel('复制'), 1200);
    }
  };

  const handleImport = async () => {
    try {
      const file = await fileOpen({
        extensions: ['.md', '.txt'],
        mimeTypes: ['text/markdown', 'text/plain']
      });
      const content = await file.text();
      onImportContent(content, file.name);
      setMode('edit');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.error('Import failed', error);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${noteTitle || 'MDNote'}-preview`,
    pageStyle: `
      @page { size: auto; margin: 14mm; }
      html, body { background: #ffffff !important; color: #111827 !important; }
      pre, code, img, table, blockquote { break-inside: avoid; page-break-inside: avoid; }
      h1, h2, h3, h4, h5, h6 { break-after: avoid; page-break-after: avoid; }
      p, li { orphans: 3; widows: 3; }
    `
  });

  const handleExportPdf = async () => {
    // Ensure latest React render is committed before opening print dialog.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    handlePrint();
  };

  return (
    <section className="workspace-root flex h-full min-h-0 flex-col border-l border-[#161b22] bg-[#0b1017]">
      <div className="print-hide border-b border-[#202833] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {zenMode ? 'Zen Writing' : 'Live Preview Workspace'}
            </p>
            <h2 className="mt-1 truncate text-base font-semibold text-slate-100">{noteTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImport}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#0a1017] px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <FileUp className="h-4 w-4" />
              导入
            </button>
            <button
              type="button"
              onClick={() => setMode((prevMode) => (prevMode === 'edit' ? 'read' : 'edit'))}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#0a1017] px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              {mode === 'edit' ? <ReadIcon /> : <EditIcon />}
              {mode === 'edit' ? '阅读模式' : '编辑模式'}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#0a1017] px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <Download className="h-4 w-4" />
              导出 PDF
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-slate-950 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <CopyIcon />
              {copyLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="print-hide min-h-0 flex-1 px-5 py-5">
        {mode === 'edit' ? (
          <div className="h-full overflow-y-auto rounded-[28px] border border-[#202833] bg-[#070c12] p-5">
            <CodeEditor
              value={value}
              onValueChange={onChange}
              highlight={(code) => Prism.highlight(code, Prism.languages.markdown, 'markdown')}
              padding={0}
              textareaClassName="outline-none"
              className="min-h-full font-mono text-sm leading-7 text-slate-200"
              style={{
                fontFamily:
                  'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            />
          </div>
        ) : (
          <article className="prose prose-invert prose-pre:bg-slate-900 prose-pre:p-5 prose-pre:rounded-lg prose-pre:border prose-pre:border-zinc-700/50 prose-pre:shadow-inner prose-code:bg-transparent h-full max-w-none overflow-y-auto rounded-[28px] border border-[#202833] bg-[#070c12] p-5">
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
                        codeTagProps={{
                          style: {
                            backgroundColor: 'inherit',
                            padding: 0
                          }
                        }}
                        customStyle={{
                          borderRadius: '0.5rem',
                          margin: 0,
                          padding: '1.25rem',
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(63, 63, 70, 0.5)',
                          boxShadow:
                            'inset 0 1px 0 rgba(255, 255, 255, 0.02), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
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
              {value}
            </ReactMarkdown>
          </article>
        )}
      </div>

      <div className="print-hide border-t border-[#202833] px-5 py-3 text-xs text-slate-500">
        行 {stats.lines} · 字符 {stats.characters} · 单词 {stats.words} · 当前模式{' '}
        {mode === 'edit' ? '编辑' : '阅读'}
      </div>

      <article ref={printRef} className="print-only print-preview prose prose-code:bg-transparent max-w-none px-10 py-8">
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
                    codeTagProps={{
                      style: {
                        backgroundColor: 'inherit',
                        padding: 0
                      }
                    }}
                    customStyle={{
                      borderRadius: '0.5rem',
                      margin: 0,
                      padding: '1.25rem',
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.05)'
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
          {value}
        </ReactMarkdown>
      </article>

    </section>
  );
}

export default LiveMarkdownWorkspace;
