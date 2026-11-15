"use client";

import { useEffect, useState } from "react";

/** Jam lokal pemilik portfolio. Baru muncul setelah mount (biar nggak beda sama HTML server). */
export function LocalClock({ timeZone, label }: { timeZone: string; label: string }) {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return (
    <span className="tabular-nums">
      {time} {label}
    </span>
  );
}
