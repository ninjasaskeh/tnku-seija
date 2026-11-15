"use client";

import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Contact: nama raksasa di bawah naik pelan seiring scroll. */
export function ContactFx() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo(
        "[data-bigname]",
        { yPercent: 55 },
        {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: "[data-bigname-wrap]", start: "top bottom", end: "bottom bottom", scrub: true },
        },
      );
    });
    return () => mm.revert();
  });
  return null;
}
