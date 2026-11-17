"use client";

import { useSyncExternalStore } from "react";
import { net, subscribeNet } from "@/lib/net";

/** RTT asli pengunjung (ms), atau "—" kalau belum/nggak bisa diukur. */
export function Rtt({ best = false }: { best?: boolean }) {
  const v = useSyncExternalStore(
    subscribeNet,
    () => (best ? net.best : net.rtt),
    () => null,
  );
  return <span className="tabular-nums">{v === null ? "—" : `${v}ms`}</span>;
}
