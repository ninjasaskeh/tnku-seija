"use client";

import { useRef, useSyncExternalStore } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CHAPTER_ORDER, CHAPTERS, stage, subscribeStage } from "@/lib/stage";

const HOPS = CHAPTER_ORDER.map((id) => ({ id, ...CHAPTERS[id] }));
const TOTAL = HOPS[HOPS.length - 1].ms;
const pad = (n: number, l = 4) => String(Math.max(0, Math.round(n))).padStart(l, "0");

/**
 * HUD: posisi request kamu di stack.
 * - kanan bawah (md+): waterfall ala DevTools + timer ms (sengaja minimal)
 *   (jalur hop-nya sendiri digambar CircuitTrace)
 * - HP: garis progres tipis di bawah header
 * Semua dekorasi → aria-hidden. Posisi ditulis langsung ke DOM (bukan state React).
 */
export function TraceHud() {
  const ms = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const mobile = useRef<HTMLSpanElement>(null);
  const chapter = useSyncExternalStore(
    subscribeStage,
    () => stage.chapter,
    () => null,
  );
  const active = chapter ? CHAPTER_ORDER.indexOf(chapter) : 0;

  useGSAP(() => {
    const last = HOPS.length - 1;
    const write = (i: number, p: number) => {
      const pos = Math.min(last, i + p) / last;
      const t = i >= last ? TOTAL : HOPS[i].ms + (HOPS[i + 1].ms - HOPS[i].ms) * p;
      if (ms.current) ms.current.textContent = pad(t);
      if (fill.current) fill.current.style.transform = `scaleX(${t / TOTAL})`;
      if (mobile.current) mobile.current.style.transform = `scaleX(${pos})`;
    };
    const sts = CHAPTER_ORDER.map((id, i) => {
      const el = document.querySelector(`[data-chapter="${id}"]`);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: "top 60%",
        end: "bottom 60%",
        onUpdate: (self) => write(i, self.progress),
        onToggle: (self) => self.isActive && write(i, self.progress),
      });
    });
    return () => sts.forEach((s) => s?.kill());
  });

  return (
    <div aria-hidden="true">
      {/* HP: progres tipis */}
      <span className="pointer-events-none fixed inset-x-0 top-0 z-50 block h-0.5 md:hidden">
        <span ref={mobile} className="bg-accent block h-full origin-left scale-x-0" />
      </span>

      {/* kanan bawah: waterfall */}
      {/* disembunyiin di Routes (nabrak indeks project) & calm mode */}
      <div
        className={`cut pointer-events-none fixed bottom-4 right-4 z-30 hidden w-64 text-micro transition-opacity md:block in-[.calm]:hidden ${chapter === "projects" ? "opacity-0" : ""}`}
      >
        <p className="flex justify-between">
          <span>{CHAPTERS[chapter ?? "hero"].layer}</span>
          <span>
            T+<span ref={ms}>0000</span>MS
          </span>
        </p>
        <span className="mt-1.5 flex h-2 gap-px">
          {HOPS.slice(1).map((h, i) => (
            <span
              key={h.id}
              style={{ flexGrow: h.ms - HOPS[i].ms }}
              className={`block h-full border border-white/60 ${i < active ? "bg-white/40" : ""}`}
            />
          ))}
        </span>
        <span className="mt-px block h-px bg-white/20">
          <span ref={fill} className="block h-full origin-left scale-x-0 bg-white" />
        </span>
      </div>
    </div>
  );
}
