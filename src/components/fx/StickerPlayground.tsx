"use client";

import { useRef } from "react";
import { PixelGlyph, type GlyphName } from "@/components/deco/PixelGlyph";
import { Draggable, FINE_POINTER, gsap, useGSAP } from "@/lib/gsap";

const STYLES = [
  "bg-acid text-ink",
  "bg-paper text-ink",
  "bg-ink text-acid",
  "bg-ink text-paper border border-paper",
];
const GLYPHS: GlyphName[] = ["skull", "frame", "check", "stair", "arrow"];

/**
 * Area main-main: stiker skill yang bisa diseret dan dilempar (Draggable + inertia).
 * Cuma muncul kalau ada mouse. Isinya ngulang daftar skill di atasnya → aria-hidden.
 */
export function StickerPlayground({ labels }: { labels: string[] }) {
  const box = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = box.current;
    if (!el || !window.matchMedia(FINE_POINTER).matches) return;
    const chips = gsap.utils.toArray<HTMLElement>("[data-chip]", el);
    let z = 10;
    const drags = Draggable.create(chips, {
      bounds: el,
      inertia: true,
      edgeResistance: 0.8,
      onPress() {
        gsap.set(this.target, { zIndex: ++z });
        gsap.to(this.target, { scale: 1.08, duration: 0.15 });
      },
      onRelease() {
        gsap.to(this.target, { scale: 1, duration: 0.2 });
      },
    });
    return () => drags.forEach((d) => d.kill());
  });

  return (
    <div
      ref={box}
      aria-hidden="true"
      data-cursor="DRAG"
      className="line-fg panel relative mt-20 hidden h-[340px] select-none overflow-hidden border fine:block"
    >
      <p className="text-dim absolute left-4 top-3 text-micro">DRAG + THROW THE STICKERS</p>
      {labels.map((label, i) => {
        // posisi deterministik (golden ratio) biar server & client sama
        const left = 4 + ((i * 61.8) % 80);
        const top = 16 + ((i * 38.2) % 62);
        const rot = ((i * 47) % 24) - 12;
        return (
          <span
            key={label}
            data-chip
            style={{ left: `${left}%`, top: `${top}%`, rotate: `${rot}deg` }}
            className={`absolute px-3 py-1.5 font-bold ${STYLES[i % STYLES.length]}`}
          >
            {label}
          </span>
        );
      })}
      {GLYPHS.map((g, i) => (
        <span
          key={g}
          data-chip
          style={{ left: `${12 + i * 17}%`, top: `${22 + ((i * 53) % 55)}%` }}
          className="absolute bg-ink p-2"
        >
          <PixelGlyph name={g} size={8} className={i % 2 ? "text-paper" : "text-acid"} />
        </span>
      ))}
    </div>
  );
}
