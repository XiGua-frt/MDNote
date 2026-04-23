/**
 * Mermaid 异步加载器与渲染追踪器。
 *
 * - `loadMermaid()`：仅在首次有 Mermaid 代码块出现时才动态 import('mermaid')，避免主包体积膨胀。
 * - `mermaidTracker`：以 add/done 计数追踪所有正在渲染的 Mermaid 实例（屏幕态 + 隐藏的打印态共用），
 *   `wait()` 在所有实例完成前不会 resolve，保证 react-to-print 触发时 SVG 已落地 DOM。
 */
import type Mermaid from 'mermaid';

type MermaidLib = typeof Mermaid;

let cachedLoader: Promise<MermaidLib> | null = null;

function detectIsDark(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;
  if (document.documentElement.classList.contains('dark')) return true;
  if (document.documentElement.classList.contains('light')) return false;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}

export function loadMermaid(): Promise<MermaidLib> {
  if (cachedLoader) return cachedLoader;
  cachedLoader = (async () => {
    const mod = await import('mermaid');
    const mermaid = (mod as unknown as { default: MermaidLib }).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: detectIsDark() ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
      flowchart: { htmlLabels: true, useMaxWidth: true }
    });
    return mermaid;
  })();
  return cachedLoader;
}

interface MermaidTracker {
  add(id: string): void;
  done(id: string): void;
  wait(timeoutMs?: number): Promise<void>;
  pendingCount(): number;
}

const pending = new Set<string>();
const waiters = new Set<() => void>();

function flushWaiters() {
  if (pending.size !== 0) return;
  waiters.forEach((resolve) => resolve());
  waiters.clear();
}

export const mermaidTracker: MermaidTracker = {
  add(id: string) {
    pending.add(id);
  },
  done(id: string) {
    if (!pending.delete(id)) return;
    flushWaiters();
  },
  pendingCount() {
    return pending.size;
  },
  wait(timeoutMs = 6000) {
    if (pending.size === 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const onResolve = () => resolve();
      waiters.add(onResolve);
      // 兜底超时：避免某次渲染异常导致打印永远阻塞。
      window.setTimeout(() => {
        if (waiters.delete(onResolve)) resolve();
      }, timeoutMs);
    });
  }
};
