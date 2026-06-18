"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const VIEW = 288; // viewport size (px)
const OUT = 720; // exported square size (px)

/**
 * Drag-to-pan, slider/wheel-to-zoom avatar cropper. A circular guide shows how
 * the photo will look as a round avatar; exports a square JPEG.
 */
export function ImageCropper({
  src,
  onCropped,
  onCancel,
}: {
  src: string;
  onCropped: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  // Load the image and centre it.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
      const base = Math.max(VIEW / img.naturalWidth, VIEW / img.naturalHeight);
      const dispW = img.naturalWidth * base;
      const dispH = img.naturalHeight * base;
      setZoom(1);
      setOffset({ x: (VIEW - dispW) / 2, y: (VIEW - dispH) / 2 });
    };
    img.src = src;
  }, [src]);

  const base = nat ? Math.max(VIEW / nat.w, VIEW / nat.h) : 1;
  const scale = base * zoom;
  const dispW = nat ? nat.w * scale : VIEW;
  const dispH = nat ? nat.h * scale : VIEW;

  const clamp = (x: number, y: number) => ({
    x: Math.min(0, Math.max(VIEW - dispW, x)),
    y: Math.min(0, Math.max(VIEW - dispH, y)),
  });

  const onZoom = (z: number) => {
    if (!nat) return;
    // keep the viewport centre stable while zooming
    const cx = (VIEW / 2 - offset.x) / scale;
    const cy = (VIEW / 2 - offset.y) / scale;
    const newScale = base * z;
    setZoom(z);
    setOffset(clamp(VIEW / 2 - cx * newScale, VIEW / 2 - cy * newScale));
  };

  const start = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => clamp(o.x + dx, o.y + dy));
  };
  const end = () => (drag.current = null);

  const crop = () => {
    const img = imgRef.current;
    if (!img) return;
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sSize = VIEW / scale;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
    onCropped(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-sm font-bold text-on-surface">
        Position your photo — drag to move, use the slider to zoom
      </p>
      <div
        className="relative touch-none overflow-hidden rounded-lg bg-surface-container-highest"
        style={{ width: VIEW, height: VIEW }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onWheel={(e) => onZoom(Math.min(3, Math.max(1, zoom - e.deltaY * 0.001)))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute select-none"
          style={{ width: dispW, height: dispH, left: offset.x, top: offset.y, maxWidth: "none" }}
        />
        {/* Circular avatar guide */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              boxShadow: "0 0 0 9999px rgba(41,0,54,0.45)",
              borderRadius: "50%",
            }}
          />
          <div className="absolute inset-0 rounded-full border-2 border-white/80" />
        </div>
      </div>

      <div className="mt-4 flex w-full max-w-[288px] items-center gap-2">
        <Icon name="zoom_out" size={20} className="text-on-surface-variant" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => onZoom(Number(e.target.value))}
          className="h-2 flex-1 accent-[#b30069]"
        />
        <Icon name="zoom_in" size={20} className="text-on-surface-variant" />
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
        >
          Back
        </button>
        <button
          type="button"
          onClick={crop}
          disabled={!nat}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
        >
          <Icon name="crop" size={20} /> Use this photo
        </button>
      </div>
    </div>
  );
}
