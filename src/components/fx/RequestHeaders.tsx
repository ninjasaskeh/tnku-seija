"use client";

import { useEffect, useState } from "react";
import { useContent } from "@/components/ContentProvider";
import { Rtt } from "./NetStatus";

type Row = [string, string];

function browser(ua: string) {
  const name = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  return `${name} / ${os}`;
}

const base = (domain: string): Row[] => [
  ["Host", domain],
  ["User-Agent", "…"],
  ["Accept", "projects/*, skills/*"],
  ["Viewport", "…"],
  ["Accept-Language", "…"],
  ["X-Local-Time", "--:--:--"],
];

/**
 * Header request PUNYA PENGUNJUNG (browser, ukuran layar, bahasa, jam lokal).
 * Server render nilai "…", diisi beneran setelah mount biar nggak beda sama HTML server.
 */
export function RequestHeaders() {
  const { profile } = useContent();
  const [rows, setRows] = useState<Row[]>(() => base(profile.domain));

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const read = (): Row[] => [
      ["Host", profile.domain],
      ["User-Agent", browser(navigator.userAgent)],
      ["Accept", "projects/*, skills/*"],
      ["Viewport", `${window.innerWidth}×${window.innerHeight}`],
      ["Accept-Language", navigator.language || "en"],
      ["X-Local-Time", fmt.format(new Date())],
    ];
    const tick = () => setRows(read());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [profile.domain]);

  return (
    <dl className="space-y-0.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <dt className="text-accent shrink-0">{k}:</dt>
          <dd className="min-w-0 truncate tabular-nums">{v}</dd>
        </div>
      ))}
      <div className="flex gap-2">
        <dt className="text-accent shrink-0">X-RTT:</dt>
        <dd className="font-bold">
          <Rtt /> <span className="text-dim font-normal"></span>
        </dd>
      </div>
    </dl>
  );
}
