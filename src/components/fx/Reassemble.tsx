"use client";

import { useRef } from "react";
import { useBooted } from "@/lib/boot";
import { calm } from "@/lib/calm";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Props = {
  text: string;
  /** view: pas masuk layar. boot: setelah boot screen. static: langsung jadi (buat salinan). */
  when?: "view" | "boot" | "static";
  delay?: number;
};

/** Acak deterministik (biar server & client sama). */
function shuffle(n: number, seed: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Teks yang dateng sebagai PAKET: tiap huruf = satu paket bernomor urut,
 * nyampe acak (out-of-order) dari posisi ngawur, lalu nyusun ke tempatnya.
 * Satu paket sengaja "drop": nongol paling akhir sebagai kotak kedip "retransmit".
 * Screen reader baca teks aslinya; versi animasi aria-hidden.
 */
export function Reassemble({ text, when = "view", delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const booted = useBooted();
  const chars = [...text];
  const seed = text.length * 131 + text.charCodeAt(0);
  const dropped = shuffle(chars.length, seed + 7).find((i) => chars[i] !== " ") ?? 0;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || when === "static" || calm.on) return;
      if (when === "boot" && !booted) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const pkts = gsap.utils.toArray<HTMLElement>("[data-c]", el);
        const order = shuffle(pkts.length, seed);
        const drop = pkts[dropped];
        const tl = gsap.timeline({
          delay,
          paused: when === "view",
          defaults: { ease: "steps(4)" },
        });

        gsap.set(pkts, { autoAlpha: 0 });
        order.forEach((idx, k) => {
          const p = pkts[idx];
          if (p === drop) return;
          tl.fromTo(
            p,
            {
              autoAlpha: 1,
              x: gsap.utils.random(-56, 56, 8),
              y: gsap.utils.random(-40, 40, 8),
              "--pk": 1,
            },
            { x: 0, y: 0, "--pk": 0, duration: 0.32, immediateRender: false },
            k * 0.045,
          );
        });
        if (drop) {
          // retransmit: kotak kedip di tempatnya, baru hurufnya masuk
          tl.set(drop, { autoAlpha: 1, "--pk": 1, "--rt": 1 }, "+=0.15")
            .to(drop, { autoAlpha: 0, duration: 0.08, repeat: 3, yoyo: true, ease: "none" })
            .to(drop, { autoAlpha: 1, "--pk": 0, "--rt": 0, duration: 0.2 });
        }

        if (when === "view") {
          const st = ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tl.play() });
          return () => {
            st.kill();
            tl.kill();
          };
        }
        return () => tl.kill();
      });
      return () => mm.revert();
    },
    { dependencies: [booted, text, when] },
  );

  return (
    <>
      <span className="sr-only">{text}</span>
      {/* overflow-x-clip: paket yang lagi terbang nggak boleh bikin halaman melebar (HP) */}
      {/* data-reasm="boot": disembunyiin CSS sampai boot selesai (globals.css) */}
      <span
        ref={ref}
        aria-hidden="true"
        data-reasm={when}
        className="inline-block max-w-full overflow-x-clip whitespace-nowrap"
      >
        {chars.map((c, i) => (
          <span key={i} data-c data-seq={String(i).padStart(2, "0")} className="pkt relative inline-block">
            {c === " " ? " " : c}
          </span>
        ))}
      </span>
    </>
  );
}
