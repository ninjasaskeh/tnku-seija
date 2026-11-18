"use client";

import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Keep-Alive: tiap detak (paragraf cerita) masuk satu-satu waktu discroll, patah-patah. */
export function KeepAliveFx() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray<HTMLElement>("#keepalive [data-beat]").forEach((beat) => {
        gsap.from(beat, {
          clipPath: "inset(0 100% 0 0)",
          clearProps: "clipPath",
          duration: 0.45,
          ease: "steps(6)",
          scrollTrigger: { trigger: beat, start: "top 85%", once: true },
        });
      });
    });
    return () => mm.revert();
  });
  return null;
}
