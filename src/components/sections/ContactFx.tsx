"use client";

import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Response: baris header ke-print satu-satu, nama raksasa di bawah naik pelan seiring scroll. */
export function ContactFx() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from("#contact [data-hdr]", {
        clipPath: "inset(0 100% 0 0)",
        duration: 0.3,
        ease: "steps(6)",
        stagger: 0.08,
        clearProps: "clipPath",
        scrollTrigger: { trigger: "#contact dl", start: "top 85%", once: true },
      });
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
