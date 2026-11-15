"use client";

import { useBooted } from "@/lib/boot";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** Intro hero setelah boot screen selesai (nggak ngerender apa-apa). */
export function HeroFx() {
  const booted = useBooted();

  useGSAP(
    () => {
      if (!booted) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("#top [data-in]", {
          y: 24,
          autoAlpha: 0,
          duration: 0.5,
          ease: "steps(5)",
          stagger: 0.1,
          delay: 0.9,
          clearProps: "all",
        });
      });
      return () => mm.revert();
    },
    { dependencies: [booted] },
  );

  return null;
}
