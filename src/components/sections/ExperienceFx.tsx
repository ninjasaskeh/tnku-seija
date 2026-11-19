"use client";

import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Logs: tiap baris access.log "dicetak" satu-satu waktu discroll, patah-patah kayak output terminal. */
export function ExperienceFx() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray<HTMLElement>("#logs [data-log]").forEach((row) => {
        gsap.from(row, {
          clipPath: "inset(0 100% 0 0)",
          clearProps: "clipPath",
          duration: 0.4,
          ease: "steps(8)",
          scrollTrigger: { trigger: row, start: "top 88%", once: true },
        });
      });
    });
    return () => mm.revert();
  });
  return null;
}
