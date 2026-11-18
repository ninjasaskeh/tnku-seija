"use client";

import { useEffect } from "react";
import { useContent } from "@/components/ContentProvider";
import { CHAPTER_ORDER, type ChapterId, stage, subscribeStage } from "@/lib/stage";

const TITLES: Record<ChapterId, string> = {
  hero: "→ GET /you",
  about: "⇄ handshaking…",
  projects: "⚙ routing /0",
  skills: "⛁ querying db…",
  keepalive: "♥ keep-alive",
  contact: "✓ 200 OK",
};

/**
 * Tab browser ikut jadi bagian konsep:
 * - judul tab = status request di hop yang lagi aktif
 * - favicon digambar ulang: 1 kotak per hop (2 baris × 3), yang udah dilewati nyala
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
      for (let k = 0; k < CHAPTER_ORDER.length; k++) {
        ctx.fillStyle = away ? "#3b2bff" : k <= i ? "#c6ff00" : "#2b2b2b";
        ctx.fillRect(3 + (k % 3) * 9, k < 3 ? 6 : 17, 8, 8);
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
