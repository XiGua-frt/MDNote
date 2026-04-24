import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, Search } from 'lucide-react';
import MermaidModal from './MermaidModal';

interface MermaidRendererProps {
  code: string;
}

const COMMENT_OR_DIRECTIVE = /^[ \t]*(?:%%|---)/;

function preprocessMermaid(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      if (COMMENT_OR_DIRECTIVE.test(line)) return line;

      // flowchart 中方括号节点若包含括号，需加引号避免 Mermaid 词法报错
      return line.replace(
        /(\b[\w-]+)\[(?!")([^\]]*\([^\]]*\)[^\]]*)\]/g,
        (_m, id: string, text: string) => `${id}["${text}"]`
      );
    })
    .join('\n');
}

function MermaidRenderer({ code }: MermaidRendererProps) {
  const baseId = `mmd${useId().replace(/:/g, '')}`;
  const [svgString, setSvgString] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const renderCount = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const count = ++renderCount.current;
    setSvgString(null);
    setError(null);

    (async () => {
      try {
        const id = `${baseId}-${count}`;
        const normalizedCode = preprocessMermaid(code);
        const { svg } = await mermaid.render(id, normalizedCode);
        if (!cancelled) setSvgString(svg);
        document.getElementById(id)?.remove();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, baseId]);

  if (error) {
    return (
      <div className="not-prose mermaid-block my-4 overflow-x-auto rounded-lg border border-rose-500/30 bg-[#1e1e2e] p-4 text-xs text-rose-200">
        <p className="mb-2 font-medium">Mermaid 渲染失败</p>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-rose-200/90">
          {error}
        </pre>
      </div>
    );
  }

  if (!svgString) {
    return (
      <div
        className="not-prose mermaid-block my-4 flex items-center gap-2 rounded-lg bg-[#1e1e2e] p-4 text-xs text-slate-400"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        正在渲染 Mermaid 图表…
      </div>
    );
  }

  return (
    <>
      <div
        className="not-prose mermaid-block group relative my-4 cursor-zoom-in overflow-x-auto rounded-lg bg-[#1e1e2e] p-4"
        role="button"
        tabIndex={0}
        aria-label="点击放大 Mermaid 图表"
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <span className="print-hide pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-slate-600/80 bg-black/45 px-2 py-1 text-[11px] text-slate-200 opacity-0 transition group-hover:opacity-100">
          <Search className="h-3 w-3" />
          点击放大
        </span>
        <div
          role="img"
          aria-label="Mermaid 图表"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
      </div>
      {isModalOpen ? (
        <MermaidModal
          svgString={svgString}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </>
  );
}

export default MermaidRenderer;
