"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { ChapterId } from "@/lib/stage";

type Via = { x: number; y: number; id: ChapterId; side: "l" | "r" };
type Layout = { h: number; d: string; vias: Via[] };

const TRAIL = 4;

/**
 * Jalur PCB raksasa yang nembus SELURUH halaman: nyambungin tiap hop (node [data-node]),
 * zig-zag kiri↔kanan dengan belokan 45° kayak trace sirkuit. Jalurnya lewat DI BAWAH panel konten.
 * Satu paket nyala ngikutin titik tengah layar; jalur di belakangnya ikut nyala.
 * Sengaja tipis & redup biar nggak rebutan perhatian sama konten. Calm mode = disembunyiin.
 * Geometri dihitung ulang tiap ukuran halaman berubah. Dekorasi → aria-hidden.
 */
export function CircuitTrace() {
  const svg = useRef<SVGSVGElement>(null);
  const base = useRef<SVGPathElement>(null);
  const lit = useRef<SVGPathElement>(null);
  const pkts = useRef<(SVGRectElement | null)[]>([]);
  const [layout, setLayout] = useState<Layout | null>(null);

  // 1. hitung jalur dari posisi node
  useEffect(() => {
    const host = svg.current?.parentElement;
    if (!host) return;

    const build = () => {
      const w = host.clientWidth;
      const h = host.scrollHeight;
      const top = host.getBoundingClientRect().top + window.scrollY;
      const gut = w < 640 ? 8 : 16;
      const L = gut;
      const R = w - gut;
      const pts: [number, number][] = [[L, 0]];
      const vias: Via[] = [];

      // gaya trace PCB: turun lurus, serong 45° pendek, lalu lurus horizontal ke (x, y).
      // Sudut 90° di ujungnya ketutup lingkaran via.
      const to = (x: number, y: number) => {
        const [px, py] = pts[pts.length - 1];
        const yy = Math.max(py, y);
        if (Math.abs(x - px) < 1) {
          pts.push([x, yy]);
          return;
        }
        const sg = Math.sign(x - px);
        const c = Math.min(28, Math.abs(x - px) / 2, yy - py);
        pts.push([px, yy - c], [px + sg * c, yy], [x, yy]);
      };

      const nodes = [...host.querySelectorAll<HTMLElement>("[data-node]")].filter((n) => n.offsetParent !== null);
      nodes.forEach((n, i) => {
        const r = n.getBoundingClientRect();
        const sec = n.closest<HTMLElement>("[data-chapter]");
        const id = (sec?.dataset.chapter ?? "hero") as ChapterId;
        to(L, r.top + window.scrollY - top + 8);
        const [nx, ny] = pts[pts.length - 1];
        vias.push({ x: nx, y: ny, id, side: "l" });

        // di tengah section: nyebrang ke kanan (lewat bawah konten), node berikutnya balik ke kiri
        if (sec) {
          const sr = sec.getBoundingClientRect();
          const sTop = sr.top + window.scrollY - top;
          const f = id === "hero" ? 0.55 : i % 2 ? 0.62 : 0.48;
          const span = id === "hero" ? Math.min(sr.height, window.innerHeight) : sr.height;
          to(R, Math.max(sTop + span * f, ny + 60));
          const [vx, vy] = pts[pts.length - 1];
          vias.push({ x: vx, y: vy, id, side: "r" });
        }
      });
      // ekor: turun sampai bawah halaman
      to(L, h);

      const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
      setLayout({ h, d, vias });
    };

    build();
    const ro = new ResizeObserver(() => build());
    ro.observe(host);
    document.fonts?.ready.then(build);
    return () => ro.disconnect();
  }, []);

  // 2. tiap frame: paket di titik jalur yang sejajar tengah layar
  useEffect(() => {
    const path = base.current;
    const litPath = lit.current;
    const host = svg.current?.parentElement;
    if (!layout || !path || !litPath || !host) return;

    const total = path.getTotalLength();
    const step = 6;
    const n = Math.ceil(total / step);
    const ys = new Float32Array(n + 1);
    const xs = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) {
      const p = path.getPointAtLength(Math.min(total, i * step));
      xs[i] = p.x;
      ys[i] = p.y;
    }
    litPath.style.strokeDasharray = `${total}`;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = -1;

    const tick = () => {
      const top = host.getBoundingClientRect().top + window.scrollY;
      const target = window.scrollY + window.innerHeight * 0.5 - top;
      // cari indeks sampel pertama yang y-nya ≥ target (jalur selalu turun → monoton)
      let lo = 0;
      let hi = n;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      const want = lo;
      // lompatan jauh (klik menu / anchor) langsung, sisanya ngejar pelan → paket "ngebut" di jalur horizontal
      cur = reduce || cur < 0 || Math.abs(want - cur) > n / 3 ? want : cur + (want - cur) * 0.22;
      const idx = Math.round(cur);
      litPath.style.strokeDashoffset = `${total - idx * step}`;
      pkts.current.forEach((r, k) => {
        const j = Math.max(0, idx - k * 4);
        if (r) r.setAttribute("transform", `translate(${xs[j]} ${ys[j]})`);
      });
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [layout]);

  return (
    <svg
      ref={svg}
      aria-hidden="true"
      height={layout?.h ?? 0}
      // lebar ikut induk (bukan angka px) biar SVG nggak pernah bikin halaman melebar
      className="pointer-events-none absolute left-0 top-0 w-full overflow-hidden in-[.calm]:hidden"
      fill="none"
    >
      {layout && (
        <>
          {/* jalur dasar tipis & redup; cuma bagian yang udah dilewatin yang nyala */}
          <path ref={base} d={layout.d} stroke="var(--stage-fg)" strokeOpacity="0.12" strokeWidth="1" />
          <path ref={lit} d={layout.d} stroke="var(--stage-light)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinejoin="bevel" />
          {layout.vias.map((v, i) => (
            <g key={i} transform={`translate(${v.x} ${v.y})`}>
              <circle r={v.side === "l" ? 5 : 3.5} fill="var(--stage-dark)" stroke="var(--stage-light)" strokeWidth="1.5" />
            </g>
          ))}
          {Array.from({ length: TRAIL }, (_, k) => {
            const s = k === 0 ? 9 : 6 - k;
            return (
              <rect
                key={k}
                ref={(el) => {
                  pkts.current[k] = el;
                }}
                x={-s / 2}
                y={-s / 2}
                width={s}
                height={s}
                fill={k === 0 ? "var(--stage-light)" : "var(--stage-fg)"}
                opacity={k === 0 ? 1 : 0.5 - k * 0.1}
              />
            );
          })}
        </>
      )}
    </svg>
  );
}
