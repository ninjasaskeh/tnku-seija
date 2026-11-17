"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { gsap, MOTION_OK, ScrollTrigger } from "@/lib/gsap";
import { lenisRef } from "@/lib/lenis";
import { startNet } from "@/lib/net";
import { attachPointer } from "@/lib/pointer";

/** Smooth scroll Lenis, disinkronin ke ticker GSAP. Mati kalau reduced motion. Juga mulai ngukur RTT. */
export function SmoothScroll() {
  useEffect(() => {
    attachPointer();
    startNet();
    if (!window.matchMedia(MOTION_OK).matches) return;

    const lenis = new Lenis({ autoRaf: false, anchors: { offset: -56 } });
    lenisRef.current = lenis;
    if (document.documentElement.classList.contains("is-booting")) lenis.stop();

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onBoot = () => lenis.start();
    window.addEventListener("boot:done", onBoot);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      window.removeEventListener("boot:done", onBoot);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}
