import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import type { Components } from 'hast-util-to-jsx-runtime';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import type { Nodes } from 'hast';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw);

export interface AsyncMarkdownResult {
  content: ReactNode | null;
  isProcessing: boolean;
  /** Resolves when the current pipeline finishes (with a safety timeout). */
  waitForComplete: (timeoutMs?: number) => Promise<void>;
}

export function useAsyncMarkdown(
  source: string,
  components?: Partial<Components>
): AsyncMarkdownResult {
  const [content, setContent] = useState<ReactNode | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const versionRef = useRef(0);
  const isProcessingRef = useRef(true);
  const waitersRef = useRef(new Set<() => void>());
  const componentsRef = useRef(components);
  componentsRef.current = components;

  useEffect(() => {
    isProcessingRef.current = isProcessing;
    if (!isProcessing && waitersRef.current.size > 0) {
      waitersRef.current.forEach((resolve) => resolve());
      waitersRef.current.clear();
    }
  }, [isProcessing]);

  useEffect(() => {
    const version = ++versionRef.current;
    setIsProcessing(true);

    (async () => {
      try {
        const mdast = processor.parse(source);
        const hast = await processor.run(mdast);
        if (version !== versionRef.current) return;

        const reactContent = toJsxRuntime(hast as Nodes, {
          Fragment,
          jsx: jsx as never,
          jsxs: jsxs as never,
          components: componentsRef.current
        });

        setContent(reactContent as ReactNode);
      } catch (error) {
        console.error('[MDNote] Async markdown processing failed:', error);
        if (version === versionRef.current) {
          setContent(null);
        }
      } finally {
        if (version === versionRef.current) {
          setIsProcessing(false);
        }
      }
    })();
  }, [source]);

  const waitForComplete = useCallback((timeoutMs = 8000): Promise<void> => {
    if (!isProcessingRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      waitersRef.current.add(resolve);
      window.setTimeout(() => {
        if (waitersRef.current.delete(resolve)) resolve();
      }, timeoutMs);
    });
  }, []);

  return { content, isProcessing, waitForComplete };
}
