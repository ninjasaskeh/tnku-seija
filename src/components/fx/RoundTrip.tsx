"use client";

import { useEffect, useRef } from "react";

const fmt = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor(ms / 60_000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  const r = Math.floor(ms % 1000);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)}.${p(r, 3)}`;
};

/**
 * Total round trip = berapa lama pengunjung udah di halaman ini.
 * Ditulis langsung ke DOM tiap frame (bukan state React). Teks aksesibelnya statis.
 */
export function RoundTrip() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) ref.current.textContent = fmt(performance.now());
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span ref={ref} aria-hidden="true" className="tabular-nums">
      00:00:00.000
    </span>
  );
}
