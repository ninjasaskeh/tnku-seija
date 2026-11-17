"use client";

import { useEffect } from "react";
import { useBooted } from "@/lib/boot";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { type ChapterId, setChapter, stage } from "@/lib/stage";

/**
 * "Sutradara": ngawasin scroll, dan tiap elemen [data-chapter] lewat tengah layar,
 * panggung diganti ke bab itu (bentuk kubus + warna halaman).
 */
export function StageDirector() {
  const booted = useBooted();

  // Bentuk & warna hero dipasang langsung pas mount, jadi kubus udah nyusun di balik boot screen.
  // Pas boot selesai, pengunjung langsung liat paketnya jadi (bukan gumpalan yang lagi berubah).
  useEffect(() => {
    if (!stage.chapter && window.scrollY < window.innerHeight * 0.5) setChapter("hero");
  }, []);

  useGSAP(
    () => {
      if (!booted) return;
      const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const els = gsap.utils.toArray<HTMLElement>("[data-chapter]");
      const triggers = els.map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 60%",
          onToggle: (self) => {
            if (self.isActive) setChapter(el.dataset.chapter as ChapterId, instant);
          },
        }),
      );
      const current = triggers.findIndex((t) => t.isActive);
      const first = els[Math.max(0, current)]?.dataset.chapter as ChapterId | undefined;
      if (!stage.chapter && first) setChapter(first, instant);
      return () => triggers.forEach((t) => t.kill());
    },
    { dependencies: [booted] },
  );

  return null;
}
