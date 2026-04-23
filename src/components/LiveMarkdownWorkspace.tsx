import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { directoryOpen, fileOpen } from 'browser-fs-access';
import { ChevronDown, Download, FileUp, FolderUp, Loader2 } from 'lucide-react';
import type { ImportedNoteDraft } from '../types/note';
import CodeEditor from 'react-simple-code-editor';
import Prism from '../prism-loader';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { useReactToPrint } from 'react-to-print';
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

type WorkspaceMode = 'edit' | 'read';

interface LiveMarkdownWorkspaceProps {
  noteTitle: string;
  value: string;
  onChange: (value: string) => void;
  onImportNotes: (drafts: ImportedNoteDraft[]) => void;
  zenMode?: boolean;
}

const IMPORTABLE_EXTENSIONS = ['.md', '.txt'] as const;

function hasImportableExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return IMPORTABLE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.(md|txt)$/i, '').trim() || '未命名笔记';
}

const isDirectoryPickerSupported =
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

function extractFolderPath(file: File): string[] {
  // `webkitRelativePath` 由 <input webkitdirectory> 与 browser-fs-access 的现代实现都会填充。
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (!rel) return [];
  const parts = rel.split('/').filter(Boolean);
  if (parts.length <= 1) return [];
  return parts.slice(0, -1);
}

async function buildDraftsFromFiles(files: readonly File[]): Promise<ImportedNoteDraft[]> {
  const importable = files.filter((file) => hasImportableExtension(file.name));
  if (importable.length === 0) {
    return [];
  }

  const readResults = await Promise.all(
    importable.map(async (file) => {
      try {
        const text = await file.text();
        return {
          name: file.name,
          size: file.size,
          content: formatMarkdownSource(text),
          folderPath: extractFolderPath(file)
        };
      } catch (error) {
        console.warn(`[MDNote] 读取文件失败：${file.name}`, error);
        return null;
      }
    })
  );

  // In-batch 去重：按 folderPath+name+size 作为轻量指纹，避免同源重复写入。
  const seen = new Set<string>();
  const drafts: ImportedNoteDraft[] = [];
  for (const item of readResults) {
    if (!item) continue;
    const fingerprint = `${item.folderPath.join('/')}::${item.name}|${item.size}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    drafts.push({
      title: stripExtension(item.name),
      content: item.content,
      sourceName: item.name,
      sourceSize: item.size,
      folderPath: item.folderPath.length > 0 ? item.folderPath : undefined
    });
  }
  return drafts;
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
  onImportNotes,
  zenMode = false
}: LiveMarkdownWorkspaceProps) {
  const [mode, setMode] = useState<WorkspaceMode>('edit');
  const [copyLabel, setCopyLabel] = useState<string>('复制');
  const [isImporting, setIsImporting] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [importHint, setImportHint] = useState<string | null>(null);
  const printRef = useRef<HTMLElement | null>(null);
  const importMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isImportMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!importMenuRef.current?.contains(event.target as Node)) {
        setIsImportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isImportMenuOpen]);

  useEffect(() => {
    if (!importHint) return;
    const timer = window.setTimeout(() => setImportHint(null), 2600);
    return () => window.clearTimeout(timer);
  }, [importHint]);

  const stats = useMemo(() => {
    const lines = value.length === 0 ? 1 : value.split('\n').length;
    const characters = value.replace(/\n/g, '').length;
    const words = value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;
    return { lines, characters, words };
  }, [value]);

  const markdownForPreview = useMemo(() => formatMarkdownSource(value), [value]);

  useEffect(() => {
    if (!import.meta.env.DEV || mode !== 'read') return;
    console.log('[MDNote] formatMarkdownSource → react-markdown input:\n', markdownForPreview);
  }, [markdownForPreview, mode]);

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

  const isUserCancelError = (error: unknown): boolean => {
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    if (error instanceof Error && /cancel|abort/i.test(error.message)) return true;
    return false;
  };

  const commitDrafts = (drafts: ImportedNoteDraft[], sourceLabel: string) => {
    if (drafts.length === 0) {
      setImportHint(`未在${sourceLabel}中找到 .md / .txt 文件`);
      return;
    }
    onImportNotes(drafts);
    setImportHint(`已导入 ${drafts.length} 条笔记`);
    setMode('edit');
  };

  const handleImportFiles = async () => {
    setIsImportMenuOpen(false);
    if (isImporting) return;
    setIsImporting(true);
    try {
      const files = await fileOpen({
        extensions: ['.md', '.txt'],
        mimeTypes: ['text/markdown', 'text/plain'],
        description: 'Markdown / 纯文本笔记',
        multiple: true
      });
      const fileList = Array.isArray(files) ? files : [files];
      const drafts = await buildDraftsFromFiles(fileList);
      commitDrafts(drafts, '所选文件');
    } catch (error) {
      if (isUserCancelError(error)) return;
      console.warn('[MDNote] 批量导入文件失败', error);
      setImportHint('导入文件失败，请重试');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportDirectory = async () => {
    setIsImportMenuOpen(false);
    if (isImporting) return;
    setIsImporting(true);
    try {
      // 特性检测：若浏览器不支持 showDirectoryPicker，browser-fs-access 会自动降级到
      // <input webkitdirectory>；这里仅做一次 UI 提示，避免用户困惑。
      if (!isDirectoryPickerSupported) {
        console.info('[MDNote] 当前浏览器不支持目录选择 API，已降级为 webkitdirectory 选择器。');
      }
      const files = await directoryOpen({ recursive: true });
      const drafts = await buildDraftsFromFiles(files as File[]);
      commitDrafts(drafts, '所选文件夹');
    } catch (error) {
      if (isUserCancelError(error)) return;
      console.warn('[MDNote] 批量导入文件夹失败', error);
      setImportHint('导入文件夹失败，请重试');
    } finally {
      setIsImporting(false);
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
            <div ref={importMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsImportMenuOpen((prev) => !prev)}
                disabled={isImporting}
                aria-haspopup="menu"
                aria-expanded={isImportMenuOpen}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#0a1017] px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                {isImporting ? '导入中…' : '导入'}
                {!isImporting ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> : null}
              </button>
              {isImportMenuOpen && !isImporting ? (
                <div
                  role="menu"
                  className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl border border-[#30363d] bg-[#0b1220] shadow-xl shadow-black/40"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleImportFiles}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-200 transition hover:bg-[#132238]"
                  >
                    <FileUp className="h-4 w-4 text-slate-400" />
                    导入文件(s)
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleImportDirectory}
                    title={isDirectoryPickerSupported ? undefined : '当前浏览器将降级使用目录选择器'}
                    className="flex w-full items-center gap-2 border-t border-[#1b2433] px-3 py-2.5 text-left text-xs text-slate-200 transition hover:bg-[#132238]"
                  >
                    <FolderUp className="h-4 w-4 text-slate-400" />
                    导入文件夹
                  </button>
                </div>
              ) : null}
              {importHint ? (
                <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-md border border-[#30363d] bg-[#0b1220] px-2 py-1 text-[11px] text-slate-200 shadow-lg">
                  {importHint}
                </span>
              ) : null}
            </div>
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

      <div className="print-hide min-h-0 flex-1">
        {mode === 'edit' ? (
          <div className="h-full overflow-y-auto px-5 py-5">
            <div className="h-full rounded-[28px] border border-[#202833] bg-[#070c12] p-5">
            <CodeEditor
              value={value}
              onValueChange={onChange}
              highlight={(code) => {
                try {
                  const md = coercePrismLanguage('markdown');
                  const grammar =
                    Prism.languages[md as keyof typeof Prism.languages] ?? Prism.languages.markup;
                  if (!grammar) return code;
                  return Prism.highlight(code, grammar, md);
                } catch (error) {
                  console.error('Editor Prism highlight failed:', error);
                  return code;
                }
              }}
              padding={0}
              textareaClassName="outline-none"
              className="min-h-full font-mono text-sm leading-7 text-slate-200"
              style={{
                fontFamily:
                  'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            />
            </div>
          </div>
        ) : (
          <Fragment>
            {/* react-markdown 产出块级节点，外层用 article，勿包在段落等行内容器内 */}
            <div className="h-full overflow-y-auto px-6 py-10 md:px-12 lg:px-20">
              <article className="prose prose-base md:prose-lg prose-invert prose-pre:bg-slate-900 prose-pre:p-5 prose-pre:rounded-lg prose-pre:border prose-pre:border-zinc-700/50 prose-pre:shadow-inner prose-code:bg-transparent mx-auto w-full max-w-5xl overflow-x-auto rounded-[28px] border border-[#202833] bg-[#070c12] p-6 md:p-8">
                <ReactMarkdown
                  remarkPlugins={[...markdownPlugins]}
                  rehypePlugins={[...rehypePlugins]}
                  components={markdownComponents}
                >
                  {markdownForPreview}
                </ReactMarkdown>
              </article>
            </div>
          </Fragment>
        )}
      </div>

      <div className="print-hide border-t border-[#202833] px-5 py-3 text-xs text-slate-500">
        行 {stats.lines} · 字符 {stats.characters} · 单词 {stats.words} · 当前模式{' '}
        {mode === 'edit' ? '编辑' : '阅读'}
      </div>

      <article
        ref={printRef}
        className="print-only print-preview prose prose-code:bg-transparent max-w-none overflow-x-auto px-10 py-8"
      >
        <ReactMarkdown
          remarkPlugins={[...markdownPlugins]}
          rehypePlugins={[...rehypePlugins]}
          components={markdownComponents}
        >
          {markdownForPreview}
        </ReactMarkdown>
      </article>

    </section>
  );
}

export default LiveMarkdownWorkspace;
