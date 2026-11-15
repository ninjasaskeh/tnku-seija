"use client";

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

/** Indikator scroll di pojok kiri bawah. Dekorasi → aria-hidden, cuma di layar lebar. */
export function ScrollHud() {
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        if (pct.current) pct.current.textContent = String(Math.round(self.progress * 100)).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleY(${self.progress})`;
      },
    });
    return () => st.kill();
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-5 left-2 z-30 hidden flex-col items-center gap-2 cut text-micro xl:flex"
    >
      <span className="relative block h-16 w-px bg-white/30">
        <span ref={bar} className="absolute inset-0 origin-top scale-y-0 bg-white" />
      </span>
      <span className="[writing-mode:vertical-rl]">
        SCROLL <span ref={pct}>000</span>%
      </span>
    </div>
  );
}
