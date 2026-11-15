"use client";

import { useEffect, useRef, useState } from "react";
import { markBooted } from "@/lib/boot";
import { gsap } from "@/lib/gsap";
import { profile } from "@/data/profile";

const LINES = [
  "mounting /dev/fonts",
  "loading design tokens",
  "compiling dither shader",
  "allocating 4096 blocks",
  "indexing ~/projects",
];

const STRIPS = 10;
const KEY = "portfolio:booted";

/**
 * Boot screen terminal → transisi glitch → halaman utama.
 * Jalan sekali per sesi tab. Bisa dilewati (klik / tombol apa aja).
 * Reduced motion: disembunyiin lewat CSS (.boot) dan langsung dianggap selesai.
 */
export function BootScreen() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const finish = () => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      markBooted();
      setDone(true);
    };

    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      finish();
      return;
    }

    document.documentElement.classList.add("is-booting");
    const q = gsap.utils.selector(el);
    const pct = q("[data-pct]")[0];
    const bar = q("[data-bar]")[0];
    const counter = { v: 0 };

    const tl = gsap.timeline({ onComplete: finish });

    // 1. log terminal muncul baris per baris + progress
    tl.set(q("[data-line]"), { autoAlpha: 0 })
      .to(q("[data-line]"), { autoAlpha: 1, duration: 0.01, stagger: 0.26 }, 0.15)
      .to(q("[data-ok]"), { autoAlpha: 1, duration: 0.01, stagger: 0.26 }, 0.33)
      .to(
        counter,
        {
          v: 100,
          duration: 1.7,
          ease: "steps(24)",
          onUpdate: () => {
            const n = Math.round(counter.v);
            if (pct) pct.textContent = String(n).padStart(3, "0");
            if (bar) bar.style.transform = `scaleX(${n / 100})`;
          },
        },
        0.15,
      )
      // 2. glitch: konten geter, bar warna nyelip (area kecil, bukan flash layar penuh)
      .addLabel("glitch", "+=0.25")
      .to(q("[data-content]"), { x: () => gsap.utils.random(-28, 28, 1), skewX: () => gsap.utils.random(-14, 14, 1), duration: 0.06, repeat: 5, repeatRefresh: true, ease: "none" }, "glitch")
      .fromTo(
        q("[data-slice]"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.05, stagger: { each: 0.05, repeat: 1, yoyo: true }, ease: "none" },
        "glitch",
      )
      .set(q("[data-content]"), { autoAlpha: 0 })
      // 3. layar hitam kebelah jadi strip, geser kiri-kanan, halaman kebuka
      .to(q("[data-strip]"), {
        xPercent: (i: number) => (i % 2 ? 101 : -101),
        duration: 0.5,
        ease: "steps(6)",
        stagger: { each: 0.035, from: "random" },
      });

    const skip = () => tl.progress(1);
    window.addEventListener("keydown", skip, { once: true });
    el.addEventListener("click", skip, { once: true });

    return () => {
      window.removeEventListener("keydown", skip);
      tl.kill();
      document.documentElement.classList.remove("is-booting");
    };
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="boot fixed inset-0 z-[90] overflow-hidden" role="status" aria-label="Loading">
      {/* strip hitam: jadi "tirai" yang kebelah di akhir */}
      <div aria-hidden="true" className="absolute inset-0 flex flex-col">
        {Array.from({ length: STRIPS }, (_, i) => (
          <div key={i} data-strip className="-mt-px flex-1 bg-ink" />
        ))}
      </div>

      {/* slice warna buat momen glitch */}
      <div aria-hidden="true" className="absolute inset-0">
        <div data-slice className="invisible absolute left-0 top-[18%] h-[5%] w-[70%] bg-acid" />
        <div data-slice className="invisible absolute right-0 top-[41%] h-[3%] w-[55%] bg-volt" />
        <div data-slice className="invisible absolute left-[10%] top-[63%] h-[7%] w-[80%] bg-paper" />
        <div data-slice className="invisible absolute right-[5%] top-[80%] h-[2%] w-[40%] bg-acid" />
      </div>

      <div data-content className="relative flex h-full flex-col justify-between p-5 text-small sm:p-8">
        <div>
          <p className="text-ash">PORTFOLIO BIOS v1.0 / {profile.name}</p>
          <ul aria-hidden="true" className="mt-6 space-y-1">
            {LINES.map((l) => (
              <li key={l} data-line className="flex gap-3">
                <span className="text-ash">&gt;</span>
                <span className="min-w-0 flex-1 truncate sm:max-w-[26rem]">{l}</span>
                <span data-ok className="invisible text-acid">
                  [ OK ]
                </span>
              </li>
            ))}
            <li data-line className="pt-3 text-acid">
              &gt; launching portfolio<span className="ml-1 inline-block h-[1em] w-[0.6em] translate-y-[2px] bg-acid" />
            </li>
          </ul>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <p className="text-ash">Click or press any key to skip</p>
            <p aria-hidden="true" className="display text-h1 text-acid">
              <span data-pct>000</span>
            </p>
          </div>
          <div aria-hidden="true" className="mt-4 h-3 border border-line">
            <div data-bar className="hazard h-full origin-left scale-x-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
