"use client";

import { useEffect, useRef, useState } from "react";
import { markBooted } from "@/lib/boot";
import { gsap } from "@/lib/gsap";
import { useContent } from "@/components/ContentProvider";

const lines = (domain: string): [string, string][] => [
  [`Resolving ${domain}`, "12ms"],
  [`Connected to ${domain} port 443`, "24ms"],
  ["TLS 1.3 handshake", "38ms"],
  // penghormatan: situs ini dibikin bareng Claude Code (header Via = perantara yang dilewati request).
  // Sengaja pendek biar nggak kepotong di HP; detailnya ada di command `credits` terminal.
  ["Via: 1.1 claude-code", "39ms"],
  ["Sending GET /you HTTP/2", "41ms"],
];

const COLS = 14;
const ROWS = 9;
const BLOCKS = 32;
const BOOT_KEY = "portfolio:booted"; // sama dengan script di layout.tsx & preview/index.html

/**
 * Boot screen = curl yang lagi nyambung ke domain kamu → progres blok → layar "dikirim" jadi paket.
 * - Jalan sekali per sesi tab. Pengunjung yang balik (reload) nggak liat sama sekali:
 *   script kecil di <head> (layout.tsx) masang `html.boot-seen` sebelum paint, CSS nyembunyiin `.boot`.
 * - Nunggu font siap (maks 700ms) biar angka gede nggak loncat ganti font.
 * - Bisa dilewati (klik / tombol apa aja). Reduced motion: disembunyiin lewat CSS.
 */
export function BootScreen() {
  const { profile } = useContent();
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const finish = () => {
      try {
        sessionStorage.setItem(BOOT_KEY, "1");
      } catch {}
      markBooted();
      setDone(true);
    };

    let seen = false;
    try {
      seen = sessionStorage.getItem(BOOT_KEY) === "1";
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      finish();
      return;
    }

    document.documentElement.classList.add("is-booting");
    const q = gsap.utils.selector(el);
    const pct = q("[data-pct]")[0];
    const blocks = q("[data-block]");
    const counter = { v: 0 };
    let tl: gsap.core.Timeline | null = null;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      tl = gsap.timeline({ onComplete: finish });

      // 1. log curl muncul baris per baris, progres blok ngisi
      tl.to(q("[data-line]"), { autoAlpha: 1, duration: 0.01, stagger: 0.28 }, 0.1)
        .to(q("[data-ok]"), { autoAlpha: 1, duration: 0.01, stagger: 0.28 }, 0.3)
        .to(
          counter,
          {
            v: 100,
            duration: 1.5,
            ease: "steps(32)",
            onUpdate: () => {
              const n = Math.round(counter.v);
              if (pct) pct.textContent = String(n).padStart(3, "0");
              const lit = Math.round((n / 100) * BLOCKS);
              blocks.forEach((b, i) => (b.style.backgroundColor = i < lit ? "#c6ff00" : ""));
            },
          },
          0.1,
        )
        // 2. layar "dikirim": gelombang diagonal dari kiri atas. Tiap sel jadi kotak bergaris tipis
        //    (paket), lalu jatuh. Sengaja cuma garis, bukan blok warna penuh, biar nggak silau.
        .addLabel("send", "+=0.2")
        // animasi hero dimulai BARENG gelombang reveal (bukan setelahnya),
        // jadi pas layar kebuka teksnya lagi nyusun, bukan udah jadi lalu diulang
        .call(markBooted, [], "send")
        .to(q("[data-content]"), { autoAlpha: 0, duration: 0.15, ease: "steps(2)" }, "send")
        .to(
          q("[data-cell]"),
          {
            keyframes: [
              { boxShadow: "inset 0 0 0 1px #c6ff00", duration: 0 },
              { scaleY: 0, duration: 0.22, ease: "steps(3)", delay: 0.06 },
            ],
            stagger: { grid: [ROWS, COLS], from: "start", amount: 0.6 },
          },
          "send",
        );
    };

    // tunggu font (biar angka & teks nggak ganti bentuk di tengah jalan), tapi jangan lama-lama
    Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 700))]).then(run);

    const skip = () => (tl ? tl.progress(1) : finish());
    window.addEventListener("keydown", skip, { once: true });
    el.addEventListener("click", skip, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", skip);
      tl?.kill();
      document.documentElement.classList.remove("is-booting");
    };
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="boot fixed inset-0 z-[90] overflow-hidden" role="status" aria-label="Loading">
      {/* grid sel hitam: tiap sel = satu "paket" yang dikirim di akhir */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <div key={i} data-cell className="-m-px origin-bottom bg-ink" />
        ))}
      </div>

      <div data-content className="relative flex h-full flex-col justify-between p-5 text-small text-paper sm:p-8">
        <div>
          <p className="text-acid">$ curl -i https://{profile.domain}/you</p>
          {/* semua baris mulai `invisible` dari HTML server → nggak ada kedip sebelum JS jalan */}
          <ul aria-hidden="true" className="mt-5 max-w-[34rem] space-y-1">
            {lines(profile.domain).map(([l, t]) => (
              <li key={l} data-line className="invisible flex gap-3">
                <span className="text-ash">*</span>
                <span className="min-w-0 flex-1 truncate">{l}</span>
                <span data-ok className="invisible text-acid">
                  {t}
                </span>
              </li>
            ))}
            <li data-line className="invisible pt-3 text-acid">
              * Waiting for response <span className="caret" />
            </li>
          </ul>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-ash">Receiving</p>
              <p className="font-bold">
                {profile.name} / {profile.role}
              </p>
            </div>
            <p aria-hidden="true" className="display text-h1 leading-none text-acid tabular-nums">
              <span data-pct>000</span>
              <span className="text-h3">%</span>
            </p>
          </div>
          <div aria-hidden="true" className="mt-4 flex h-3 gap-1">
            {Array.from({ length: BLOCKS }, (_, i) => (
              <span key={i} data-block className="flex-1 bg-line" />
            ))}
          </div>
          <p className="mt-3 text-micro text-ash">Click or press any key to skip</p>
        </div>
      </div>
    </div>
  );
}
