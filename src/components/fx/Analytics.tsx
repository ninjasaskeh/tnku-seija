"use client";

import { useEffect } from "react";
import { stage, subscribeStage } from "@/lib/stage";

const KEY = "portfolio:visit";

/**
 * Analytics anonim ke /api/track: satu "view" per tab + satu "hop" tiap bab pertama kali dibuka.
 * Nggak pake cookie; id kunjungan acak per tab (sessionStorage).
 * Hormatin Do Not Track / Global Privacy Control: kalau nyala, nggak ngirim apa-apa.
 */
export function Analytics() {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    if (location.protocol === "file:") return;

    let visitId: string | null = null;
    try {
      visitId = sessionStorage.getItem(KEY);
      if (!visitId) {
        visitId = crypto.randomUUID();
        sessionStorage.setItem(KEY, visitId);
      }
    } catch {
      visitId = crypto.randomUUID();
    }

    const send = (data: Record<string, unknown>) => {
      const body = JSON.stringify({ visitId, ...data });
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
        fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
          () => {},
        );
      }
    };

    let referrer: string | null = null;
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      referrer = r && r.host !== location.host ? r.hostname : null;
    } catch {}
    send({
      type: "view",
      path: location.pathname,
      referrer,
      device: matchMedia("(pointer: coarse), (max-width: 767px)").matches ? "mobile" : "desktop",
    });

    const seen = new Set<string>();
    const onStage = () => {
      const hop = stage.chapter;
      if (!hop || seen.has(hop)) return;
      seen.add(hop);
      send({ type: "hop", hop });
    };
    onStage();
    return subscribeStage(onStage);
  }, []);

  return null;
}
