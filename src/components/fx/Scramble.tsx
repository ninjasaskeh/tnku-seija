"use client";

import { useRef } from "react";
import { useBooted } from "@/lib/boot";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

type Props = {
  text: string;
  className?: string;
  /** view: pas masuk layar. boot: setelah boot screen. hover: pas link/tombol induknya di-hover. */
  when?: "view" | "boot" | "hover";
  delay?: number;
  duration?: number;
};

const CHARS = "01#/<>_X";

/**
 * Teks scramble (GSAP ScrambleText). Screen reader baca teks aslinya,
 * versi yang dianimasi aria-hidden.
 */
export function Scramble({ text, className, when = "view", delay = 0, duration = 1 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const booted = useBooted();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (when === "boot" && !booted) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const scrambleText = { text, chars: CHARS, speed: 0.5, revealDelay: duration * 0.25 };

        if (when === "hover") {
          const host = el.closest("a, button") ?? el;
          const run = () =>
            gsap.to(el, { duration: 0.6, ease: "none", overwrite: true, scrambleText: { ...scrambleText, revealDelay: 0.1 } });
          host.addEventListener("pointerenter", run);
          return () => host.removeEventListener("pointerenter", run);
        }

        gsap.to(el, {
          duration,
          delay,
          ease: "none",
          scrambleText,
          scrollTrigger: when === "view" ? { trigger: el, start: "top 88%", once: true } : undefined,
        });
      });
      return () => mm.revert();
    },
    { dependencies: [booted, text, when] },
  );

  return (
    <>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true" className={className}>
        {text}
      </span>
    </>
  );
}
