"use client";

import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Skills: tiap baris nama skill geser horizontal seiring scroll, arahnya selang-seling. */
export function SkillsFx() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
      gsap.utils.toArray<HTMLElement>("#skills [data-row]").forEach((row, i) => {
        const overflow = () => Math.max(0, row.scrollWidth - window.innerWidth);
        const from = i % 2 ? () => -overflow() : 0;
        const to = i % 2 ? 0 : () => -overflow();
        gsap.fromTo(
          row,
          { x: from },
          {
            x: to,
            ease: "none",
            scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: 0.4, invalidateOnRefresh: true },
          },
        );
      });
    });
    return () => mm.revert();
  });
  return null;
}
