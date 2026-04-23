import { useEffect, useId, useState } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Search, X } from 'lucide-react';
import { loadMermaid, mermaidTracker } from '../utils/mermaidLoader';

interface MermaidBlockProps {
  code: string;
}

/**
 * 单个 Mermaid 图表的异步渲染器：
 * - 首次进入会触发 mermaid 库的动态加载；
 * - 渲染期间显示轻量 loading 占位；失败时降级为可读的源码 + 错误提示；
 * - 通过 `mermaidTracker` 上报 add/done，供导出 PDF 时同步等待。
 */
function MermaidBlock({ code }: MermaidBlockProps) {
  const reactId = useId().replace(/[:]/g, '-');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const closeZoom = () => setIsZoomOpen(false);

  useEffect(() => {
    if (!isZoomOpen) return;
    setZoom(1);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsZoomOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isZoomOpen]);

  const handleWheelZoom = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    setZoom((prev) => Math.min(3, Math.max(0.5, +(prev + delta).toFixed(2))));
  };

  useEffect(() => {
    let cancelled = false;
    const trackId = `${reactId}-${Math.random().toString(36).slice(2, 8)}`;
    mermaidTracker.add(trackId);
    setError(null);
    setSvg(null);

    (async () => {
      try {
        const mermaid = await loadMermaid();
        if (cancelled) return;
        const renderId = `mmd-${trackId}`;
        const { svg: rendered } = await mermaid.render(renderId, code);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        mermaidTracker.done(trackId);
      }
    })();

    return () => {
      cancelled = true;
      mermaidTracker.done(trackId);
    };
  }, [code, reactId]);

  if (error) {
    const isParseError = /parse|syntax|lexical|expect/i.test(error);
    return (
      <div className="not-prose mermaid-block mermaid-block--error my-4 overflow-x-auto rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200">
        <p className="mb-2 font-medium">
          {isParseError
            ? 'Mermaid 语法错误：请检查是否包含未包裹的特殊字符（建议为节点文本加双引号）。'
            : `Mermaid 渲染失败：${error}`}
        </p>
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-rose-100/80">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className="not-prose mermaid-block mermaid-block--loading my-4 flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-xs text-slate-400"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        正在加载 Mermaid 图表…
      </div>
    );
  }

  return (
    <>
      <div
        className="not-prose mermaid-block mermaid-block--interactive group relative my-4 cursor-zoom-in overflow-x-auto rounded-lg border border-slate-700/40 bg-slate-950/40 p-4 transition hover:border-cyan-400/45 hover:bg-slate-900/65"
        role="button"
        aria-label="点击放大 Mermaid 图表"
        tabIndex={0}
        onClick={() => setIsZoomOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsZoomOpen(true);
          }
        }}
      >
        <span className="print-hide pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-slate-600/80 bg-black/45 px-2 py-1 text-[11px] text-slate-200 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <Search className="h-3 w-3" />
          点击放大
        </span>
        <div
          role="img"
          aria-label="Mermaid 图表"
          // mermaid 输出的 SVG 已是可信内容（库内部生成），用 dangerouslySetInnerHTML 嵌入即可。
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {isZoomOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="print-hide fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 md:p-8"
              onClick={closeZoom}
            >
              <div
                className="relative flex max-h-[92vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 shadow-2xl md:max-w-[92vw]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="pointer-events-none absolute left-3 top-3 z-10 hidden rounded-full border border-slate-600/80 bg-black/55 px-2.5 py-1 text-[11px] text-slate-200 md:block">
                  滚轮缩放 {Math.round(zoom * 100)}%
                </div>
                <button
                  type="button"
                  className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600/90 bg-black/55 text-slate-200 transition hover:border-slate-400 hover:text-white"
                  onClick={closeZoom}
                  aria-label="关闭 Mermaid 预览"
                >
                  <X className="h-4 w-4" />
                </button>
                <div
                  className="mermaid-modal-view min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,#132034_0%,#0d1117_48%,#090c10_100%)] p-2 md:p-3"
                  onWheel={handleWheelZoom}
                >
                  <div
                    className="mermaid-modal-svg mx-auto w-max min-w-full text-slate-100"
                    role="img"
                    aria-label="Mermaid 图表放大预览"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export default MermaidBlock;
