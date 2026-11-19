"use client";

import { useEffect } from "react";
import { useContent } from "@/components/ContentProvider";
import { CHAPTER_ORDER, type ChapterId, stage, subscribeStage } from "@/lib/stage";

const TITLES: Record<ChapterId, string> = {
  hero: "→ GET /you",
  about: "⇄ handshaking…",
  projects: "⚙ routing /0",
  logs: "▤ tail -f access.log",
  skills: "⛁ querying db…",
  keepalive: "♥ keep-alive",
  contact: "✓ 200 OK",
};

/**
 * Tab browser ikut jadi bagian konsep:
 * - judul tab = status request di hop yang lagi aktif
 * - favicon digambar ulang: 1 kotak per hop (2 baris), yang udah dilewati nyala
 * - tab ditinggal → "connection idle", balik lagi → "reconnected"
 */
export function TabPresence() {
  const { name } = useContent().profile;

  useEffect(() => {
    const original = document.title;
    // favicon statis (src/app/icon1.svg + icon2.png) ada 2 tag; semuanya diganti biar
    // browser nggak milih yang statis, lalu dibalikin pas komponen dilepas
    let links = [...document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']")];
    if (!links.length) {
      const l = document.createElement("link");
      l.rel = "icon";
      document.head.appendChild(l);
      links = [l];
    }
    const prev = links.map((l) => ({ href: l.href, type: l.type, sizes: l.getAttribute("sizes") }));
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d");
    let away = false;
    let timer = 0;

    const draw = () => {
      if (!ctx) return;
      const i = stage.chapter ? CHAPTER_ORDER.indexOf(stage.chapter) : 0;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 32, 32);
      // 2 baris, baris atas dapet sisa kalau ganjil (7 hop = 4 + 3), tiap baris di tengah
      const n = CHAPTER_ORDER.length;
      const cols = Math.ceil(n / 2);
      const size = Math.floor((28 - (cols - 1)) / cols);
      for (let k = 0; k < n; k++) {
        const row = k < cols ? 0 : 1;
        const inRow = row ? n - cols : cols;
        const x0 = Math.round((32 - (inRow * size + (inRow - 1))) / 2);
        ctx.fillStyle = away ? "#3b2bff" : k <= i ? "#c6ff00" : "#2b2b2b";
        ctx.fillRect(x0 + (row ? k - cols : k) * (size + 1), row ? 17 : 17 - size - 2, size, size);
      }
      const url = c.toDataURL("image/png");
      for (const l of links) {
        l.type = "image/png";
        l.removeAttribute("sizes");
        l.href = url;
      }
    };

    const title = () => {
      if (away) {
        document.title = "⚠ connection idle… come back";
        return;
      }
      const id = stage.chapter ?? "hero";
      const label = id === "projects" ? `${TITLES.projects}${stage.project + 1}` : TITLES[id];
      document.title = `${label} · ${name}`;
    };

    const update = () => {
      title();
      draw();
    };

    const vis = () => {
      window.clearTimeout(timer);
      away = document.hidden;
      if (!away) {
        document.title = `↻ reconnected · ${name}`;
        draw();
        timer = window.setTimeout(update, 1600);
        return;
      }
      update();
    };

    update();
    const unsub = subscribeStage(update);
    document.addEventListener("visibilitychange", vis);
    return () => {
      unsub();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", vis);
      document.title = original;
      links.forEach((l, i) => {
        const p = prev[i]!;
        l.href = p.href;
        l.type = p.type;
        if (p.sizes) l.setAttribute("sizes", p.sizes);
      });
    };
  }, [name]);

  return null;
}
