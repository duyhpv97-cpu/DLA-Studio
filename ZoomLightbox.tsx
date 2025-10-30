import React, { useEffect, useRef, useState } from "react";

type Item = { url: string; meta?: any };

export default function ZoomLightbox({
  items,
  index,
  open,
  onClose,
  onIndexChange
}: {
  items: Item[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [pinch, setPinch] = useState<null | { d0: number; s0: number }>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const current = items[index]?.url || "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
      if (e.key === "+") zoomBy(0.2);
      if (e.key === "-") zoomBy(-0.2);
      if (e.key.toLowerCase() === "f") fit();
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, items.length]);

  useEffect(() => {
    // Reset zoom/pan when image changes
    reset(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function reset(immediate = false) {
    setScale(1);
    setTx(0);
    setTy(0);
  }
  function fit() {
    // With this UI, default scale 1 is already fit; just reset pan.
    setTx(0); setTy(0);
  }
  function zoomBy(delta: number, cx?: number, cy?: number) {
    const newScale = clamp(scale + delta, 0.2, 8);
    if (!containerRef.current) return setScale(newScale);

    // Zoom into point (cx, cy) for a natural feel
    const rect = containerRef.current.getBoundingClientRect();
    const px = (cx ?? rect.width / 2) - rect.width / 2;
    const py = (cy ?? rect.height / 2) - rect.height / 2;
    const k = newScale / scale;
    setTx(tx => k * (tx - px) + px);
    setTy(ty => k * (ty - py) + py);
    setScale(newScale);
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const isTrackpad = Math.abs(e.deltaY) < 50;
    if (e.ctrlKey || !isTrackpad) {
      zoomBy(-e.deltaY / 500, e.clientX, e.clientY);
    } else {
      // Trackpad pan
      setTx(v => v - e.deltaX);
      setTy(v => v - e.deltaY);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);
    if (e.isPrimary) {
      setIsPanning(true);
      setStart({ x: e.clientX - tx, y: e.clientY - ty });
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!containerRef.current) return;

    // FIX: Added 'unknown' to the type assertion to fix a TypeScript error regarding incompatible event types.
    const touches = (e.nativeEvent as unknown as TouchEvent).touches;
    if (touches && touches.length >= 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const d = Math.hypot(dx, dy);
      if (!pinch) {
        setPinch({ d0: d, s0: scale });
      } else {
        const k = d / pinch.d0;
        const newScale = clamp(pinch.s0 * k, 0.2, 8);
        setScale(newScale);
      }
      return;
    }
    
    // Pan
    if (isPanning && start) {
      setTx(e.clientX - start.x);
      setTy(e.clientY - start.y);
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    const el = e.currentTarget as HTMLDivElement;
    try { el.releasePointerCapture(e.pointerId); } catch {}
    setIsPanning(false);
    setStart(null);
    setPinch(null);
  }

  function onDoubleClick(e: React.MouseEvent) {
    // Toggle 1x <-> 2x at click point
    if (scale < 1.9) zoomBy(1, e.clientX, e.clientY);
    else reset();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-white text-sm backdrop-blur">
        <button onClick={()=>onIndexChange((index - 1 + items.length) % items.length)} title="Previous (Left Arrow)" className="px-2 hover:bg-white/10 rounded-full">←</button>
        <div className="text-xs opacity-80" aria-live="polite">{index+1} / {items.length}</div>
        <button onClick={()=>onIndexChange((index + 1) % items.length)} title="Next (Right Arrow)" className="px-2 hover:bg-white/10 rounded-full">→</button>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <button onClick={()=>zoomBy(0.25)} title="Zoom in (+)" className="px-2 hover:bg-white/10 rounded-full">+</button>
        <button onClick={()=>zoomBy(-0.25)} title="Zoom out (-)" className="px-2 hover:bg-white/10 rounded-full">−</button>
        <button onClick={fit} title="Fit to screen (F)" className="px-2 hover:bg-white/10 rounded-full">Fit</button>
        <button onClick={()=>reset()} title="Actual size (0)" className="px-2 hover:bg-white/10 rounded-full">1:1</button>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <a href={current} download className="px-2 hover:bg-white/10 rounded-full">Download</a>
        <button onClick={onClose} title="Close (Escape)" className="px-2 hover:bg-white/10 rounded-full">✕</button>
      </div>

      {/* stage */}
      <div
        ref={containerRef}
        className="absolute inset-0 select-none touch-pan-y"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center center",
            willChange: "transform"
          }}
        >
          <img
            src={current}
            alt={`Preview ${index + 1}`}
            className="max-h-[88vh] max-w-[92vw] object-contain shadow-2xl"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
