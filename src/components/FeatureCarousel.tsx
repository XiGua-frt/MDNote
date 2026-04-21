import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AUTO_MS = 5200;

export interface FeatureSlide {
  id: string;
  title: string;
  subtitle: string;
  /** 占位面板内的 JSX */
  preview: ReactNode;
}

function FakeChromeBar() {
  return (
    <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-2.5 py-1.5">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
      <span className="ml-2 font-mono text-[10px] text-slate-500">preview.md — MDNote</span>
    </div>
  );
}

function SlideMarkdownMock() {
  return (
    <div className="flex min-h-[96px] font-mono text-[10px] leading-relaxed md:min-h-[108px] md:text-[11px]">
      <div className="select-none border-r border-slate-700/60 bg-black/30 px-2 py-3 text-right text-slate-600">
        {['1', '2', '3', '4', '5', '6'].map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      <div className="flex-1 space-y-1 p-3 text-slate-300">
        <p>
          <span className="text-cyan-400/90">#</span> Stream 模块总结
        </p>
        <p className="text-slate-500">LangChain 流式输出 · 面试速记</p>
        <p>
          <span className="text-violet-400/90">```</span>
          <span className="text-emerald-400/90">python</span>
        </p>
        <p>
          <span className="text-sky-300/90">async</span> <span className="text-sky-200/80">def</span>{' '}
          <span className="text-amber-200/90">stream_tokens</span>
          <span className="text-slate-400">():</span>
        </p>
        <p className="pl-2 text-slate-500">
          <span className="text-slate-400">yield</span> <span className="text-emerald-300/80">&quot;chunk&quot;</span>
        </p>
        <p>
          <span className="text-violet-400/90">```</span>
        </p>
      </div>
    </div>
  );
}

function SlideTableMock() {
  return (
    <div className="min-h-[96px] p-2.5 font-mono text-[10px] md:min-h-[108px] md:text-[11px]">
      <p className="mb-2 text-slate-400">| 能力 | 说明 |</p>
      <p className="text-cyan-400/70">| --- | --- |</p>
      <p className="text-slate-300">| 流式 | 降低首字节延迟 |</p>
      <p className="text-slate-300">| 回溯 | 便于调试与审计 |</p>
    </div>
  );
}

function SlideArchitectureMock() {
  return (
    <div className="flex min-h-[96px] items-center justify-center gap-2 p-2.5 md:min-h-[108px] md:gap-2.5">
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-2 py-3 text-center text-[10px] text-cyan-100/90 md:px-3 md:text-xs">
        Sidebar
      </div>
      <span className="text-cyan-500/50">→</span>
      <div className="rounded-lg border border-sky-500/35 bg-sky-500/5 px-2 py-3 text-center text-[10px] text-sky-100/90 md:px-3 md:text-xs">
        Editor
      </div>
      <span className="text-cyan-500/50">→</span>
      <div className="rounded-lg border border-violet-500/35 bg-violet-500/5 px-2 py-3 text-center text-[10px] text-violet-100/90 md:px-3 md:text-xs">
        Preview
      </div>
    </div>
  );
}

function SlidePdfMock() {
  return (
    <div className="min-h-[96px] space-y-1.5 p-2.5 font-mono text-[10px] text-slate-400 md:min-h-[108px] md:text-[11px]">
      <p>
        <span className="text-cyan-400/80">[print]</span> react-to-print
      </p>
      <p className="rounded border border-slate-700/50 bg-black/25 p-2 text-slate-500">
        @page margin: 14mm · 仅导出正文区域
      </p>
      <p className="text-slate-600">→ 另存为 PDF · 离线归档</p>
    </div>
  );
}

const DEFAULT_SLIDES: FeatureSlide[] = [
  {
    id: 'md',
    title: '实时 Markdown 预览',
    subtitle: 'GFM 表格、换行与代码块一体化渲染',
    preview: <SlideMarkdownMock />
  },
  {
    id: 'table',
    title: '表格与排版',
    subtitle: '阅读模式下的居中栏宽与呼吸感排版',
    preview: <SlideTableMock />
  },
  {
    id: 'arch',
    title: '双栏工作流',
    subtitle: '侧栏 · 编辑 · 预览 同屏协作',
    preview: <SlideArchitectureMock />
  },
  {
    id: 'pdf',
    title: '导出与打印',
    subtitle: '系统打印对话框一键出 PDF',
    preview: <SlidePdfMock />
  }
];

function normalizeDiff(i: number, active: number, len: number): number {
  let d = i - active;
  if (d > len / 2) d -= len;
  if (d < -len / 2) d += len;
  return d;
}

export default function FeatureCarousel({ slides = DEFAULT_SLIDES }: { slides?: FeatureSlide[] }) {
  const len = slides.length;
  const [active, setActive] = useState(0);
  const [stageFocused, setStageFocused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const activeScale = stageFocused ? 1 : 0.9;

  const scheduleAutoplay = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setActive((n) => (n + 1) % len);
    }, AUTO_MS);
  }, [len]);

  useEffect(() => {
    scheduleAutoplay();
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [scheduleAutoplay]);

  const handleDot = (index: number) => {
    setActive(index);
    scheduleAutoplay();
  };

  const handleArrow = (delta: number) => {
    setActive((n) => {
      const t = (n + delta) % len;
      return t < 0 ? t + len : t;
    });
    scheduleAutoplay();
  };

  const transforms = useMemo(() => {
    return slides.map((_, i) => {
      const d = normalizeDiff(i, active, len);
      if (d === 0) {
        return {
          transform: `translateX(0) translateZ(0) rotateY(0deg) scale(${activeScale})`,
          opacity: 1,
          zIndex: 30,
          pointerEvents: 'auto' as const
        };
      }
      if (d === 1 || d === -(len - 1)) {
        return {
          transform: 'translateX(34%) translateZ(-120px) rotateY(-22deg) scale(0.78)',
          opacity: 0.4,
          zIndex: 10,
          pointerEvents: 'none' as const
        };
      }
      if (d === -1 || d === len - 1) {
        return {
          transform: 'translateX(-34%) translateZ(-120px) rotateY(22deg) scale(0.78)',
          opacity: 0.4,
          zIndex: 10,
          pointerEvents: 'none' as const
        };
      }
      return {
        transform: 'translateX(0) translateZ(-220px) rotateY(0deg) scale(0.66)',
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const
      };
    });
  }, [active, activeScale, len, slides]);

  return (
    <div className="my-4 flex w-full max-w-xl shrink-0 flex-col items-center justify-center md:my-6">
      <div
        className="relative z-10 mx-auto w-full max-w-xl [perspective:1200px]"
        aria-roledescription="carousel"
        aria-label="产品特性轮播"
        onMouseEnter={() => setStageFocused(true)}
        onMouseLeave={() => setStageFocused(false)}
        onFocusCapture={() => setStageFocused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setStageFocused(false);
          }
        }}
      >
        <div className="relative isolate mx-auto h-[min(26vh,240px)] w-full max-h-[280px] max-w-xl overflow-hidden rounded-xl px-1 pb-2 pt-1 sm:h-[min(28vh,260px)] md:max-h-[300px]">
          {slides.map((slide, i) => {
            const t = transforms[i];
            return (
              <article
                key={slide.id}
                aria-hidden={i !== active}
                className="absolute inset-x-1 inset-y-1 origin-center rounded-xl border border-cyan-500/25 bg-gradient-to-br from-[#0c1522]/95 via-[#0a1018]/95 to-[#070c12]/95 p-1 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.72)] ring-1 ring-cyan-400/10 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  transform: t.transform,
                  opacity: t.opacity,
                  zIndex: t.zIndex,
                  pointerEvents: t.pointerEvents
                }}
              >
                <div className="flex h-full flex-col overflow-hidden rounded-[0.65rem] border border-slate-800/80 bg-[#070b12]/90">
                  <FakeChromeBar />
                  <div className="border-b border-cyan-500/10 px-3 py-2 md:px-3.5 md:py-2.5">
                    <h3 className="text-xs font-semibold tracking-tight text-slate-100 md:text-sm">{slide.title}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 md:text-xs">{slide.subtitle}</p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">{slide.preview}</div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 md:mt-4">
          <button
            type="button"
            onClick={() => handleArrow(-1)}
            className="rounded-full border border-slate-700/80 bg-slate-950/80 p-2 text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-200"
            aria-label="上一张"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleDot(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === active
                    ? 'scale-125 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.45)]'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`切换到第 ${i + 1} 张`}
                aria-current={i === active}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleArrow(1)}
            className="rounded-full border border-slate-700/80 bg-slate-950/80 p-2 text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-200"
            aria-label="下一张"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
