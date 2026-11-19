"use client";

import { useEffect } from "react";
import { FINE_POINTER, gsap, MOTION_OK } from "@/lib/gsap";
import { calm } from "@/lib/calm";
import { ping } from "@/lib/net";

const SKIP =
  "a, button, input, textarea, select, label, [data-cursor], [role='log'], table, [data-vaul-drawer], [data-vaul-overlay]";

/**
 * Klik di area kosong mana aja = kirim ping BENERAN ke server.
 * Muncul cincin pixel yang mekar dari titik klik + label "ICMP" dengan RTT asli.
 * Cuma pake mouse + boleh animasi. Dekorasi → elemen dibikin aria-hidden lalu dibuang.
 */
export function PingField() {
  useEffect(() => {
    if (!window.matchMedia(`${MOTION_OK} and ${FINE_POINTER}`).matches) return;

    const fire = async (e: MouseEvent) => {
      if (calm.on || e.button !== 0 || (e.target as Element | null)?.closest?.(SKIP)) return;
      if (window.getSelection()?.toString()) return;

      const root = document.createElement("div");
      root.setAttribute("aria-hidden", "true");
      root.className = "pointer-events-none fixed z-[95] mix-blend-difference text-paper";
      root.style.left = `${e.clientX}px`;
      root.style.top = `${e.clientY}px`;
      const N = 12;
      for (let i = 0; i < N; i++) {
        const b = document.createElement("span");
        b.className = "absolute block size-2 -translate-1/2 bg-current";
        root.appendChild(b);
      }
      const label = document.createElement("span");
      label.className = "absolute left-3 top-3 whitespace-nowrap font-mono text-micro font-bold";
      label.textContent = "PING …";
      root.appendChild(label);
      document.body.appendChild(root);

      const boxes = [...root.querySelectorAll<HTMLElement>("span.size-2")];
      const tl = gsap.timeline({ onComplete: () => root.remove() });
      tl.fromTo(
        boxes,
        { x: 0, y: 0, scale: 1.4 },
        {
          x: (i: number) => Math.cos((i / N) * Math.PI * 2) * 70,
          y: (i: number) => Math.sin((i / N) * Math.PI * 2) * 70,
          scale: 0.3,
          duration: 0.6,
          ease: "steps(6)",
        },
      )
        .to(boxes, { autoAlpha: 0, duration: 0.2, ease: "steps(2)" })
        .to(label, { y: -22, autoAlpha: 0, duration: 0.5, ease: "steps(5)" }, "+=0.5");

      const ms = await ping();
      label.textContent = ms === null ? "PING · NO ROUTE" : `ICMP ECHO · ${ms}MS`;
    };

    window.addEventListener("click", fire);
    return () => window.removeEventListener("click", fire);
  }, []);

  return null;
}
