import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface MermaidModalProps {
  svgString: string;
  onClose: () => void;
}

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 30;
const WHEEL_EXP_SENSITIVITY = 0.0018;

function MermaidModal({ svgString, onClose }: MermaidModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOriginRef = useRef({ x: 0, y: 0 });

  const resolveInitialZoom = (fitZoom: number): number => {
    if (fitZoom < 0.2) return Math.min(MAX_ZOOM, fitZoom * 6);
    if (fitZoom < 0.35) return Math.min(MAX_ZOOM, fitZoom * 4);
    if (fitZoom < 0.6) return Math.min(MAX_ZOOM, fitZoom * 2.5);
    return Math.min(MAX_ZOOM, fitZoom * 1.2);
  };

  const normalizeWheelDelta = (e: WheelEvent): number => {
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * 16;
    if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * 800;
    return e.deltaY;
  };

  const applyBestFitZoom = () => {
    const container = containerRef.current;
    const svg = svgHostRef.current?.querySelector('svg');
    if (!container || !svg) return;

    const cRect = container.getBoundingClientRect();
    const sRect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox?.baseVal;
    const sourceWidth = viewBox?.width && viewBox.width > 0 ? viewBox.width : sRect.width;
    const sourceHeight = viewBox?.height && viewBox.height > 0 ? viewBox.height : sRect.height;
    if (sourceWidth <= 0 || sourceHeight <= 0) return;

    const paddingRatio = 0.9;
    const fitX = (cRect.width * paddingRatio) / sourceWidth;
    const fitY = (cRect.height * paddingRatio) / sourceHeight;
    const fitZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(fitX, fitY)));
    const initialZoom = resolveInitialZoom(fitZoom);

    setZoom(+initialZoom.toFixed(3));
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const normalizedDelta = normalizeWheelDelta(e);
      const rawScale = Math.exp(-normalizedDelta * WHEEL_EXP_SENSITIVITY);
      const scale = Math.min(2.2, Math.max(0.45, rawScale));
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;

      setZoom((prev) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(prev * scale).toFixed(3)));
        if (next === prev) return prev;
        const r = next / prev;
        setOffset((o) => ({
          x: +(o.x * r + (1 - r) * cx).toFixed(2),
          y: +(o.y * r + (1 - r) * cy).toFixed(2),
        }));
        return next;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => applyBestFitZoom());
    const onResize = () => applyBestFitZoom();
    window.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [svgString]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOriginRef.current = { ...offset };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: +(dragOriginRef.current.x + e.clientX - dragStartRef.current.x).toFixed(2),
      y: +(dragOriginRef.current.y + e.clientY - dragStartRef.current.y).toFixed(2),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    applyBestFitZoom();
  };

  return createPortal(
    <div
      className="print-hide fixed inset-0 z-[120] bg-[#1e1e2e]"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-slate-200">
        缩放 {Math.round(zoom * 100)}% · 双击重置适配 · ESC 关闭
      </div>
      <button
        type="button"
        className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600/90 bg-black/55 text-slate-200 transition hover:border-slate-400 hover:text-white"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="关闭预览"
      >
        <X className="h-4 w-4" />
      </button>
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleReset}
      >
        <div
          ref={svgHostRef}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
      </div>
    </div>,
    document.body,
  );
}

export default MermaidModal;
