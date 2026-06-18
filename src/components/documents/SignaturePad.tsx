"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { Icon } from "@/components/ui/Icon";

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  toDataURL: () => string;
  clear: () => void;
}

/** A draw-with-finger/mouse signature canvas. */
export const SignaturePad = forwardRef<SignaturePadHandle, { onChange?: () => void }>(
  function SignaturePad({ onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const empty = useRef(true);
    const last = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Size the backing store to the displayed size * DPR for crisp lines.
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1e1b1c";
    }, []);

    const pos = (e: PointerEvent | React.PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: React.PointerEvent) => {
      e.preventDefault();
      drawing.current = true;
      last.current = pos(e);
      canvasRef.current?.setPointerCapture(e.pointerId);
    };
    const move = (e: React.PointerEvent) => {
      if (!drawing.current) return;
      const ctx = canvasRef.current!.getContext("2d")!;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.current!.x, last.current!.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
      if (empty.current) {
        empty.current = false;
        onChange?.();
      }
    };
    const end = () => {
      drawing.current = false;
      last.current = null;
    };

    useImperativeHandle(ref, () => ({
      isEmpty: () => empty.current,
      toDataURL: () => canvasRef.current!.toDataURL("image/png"),
      clear: () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        empty.current = true;
        onChange?.();
      },
    }));

    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-40 w-full touch-none rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest"
        />
        <span className="pointer-events-none absolute bottom-2 left-3 text-xs text-on-surface-variant">
          ✕ Sign here
        </span>
        <button
          type="button"
          onClick={() => (ref as React.RefObject<SignaturePadHandle>)?.current?.clear()}
          className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-surface-container px-2 py-1 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
        >
          <Icon name="ink_eraser" size={14} /> Clear
        </button>
      </div>
    );
  },
);
