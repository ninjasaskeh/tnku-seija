"use client";

import { useEffect } from "react";
import { profile } from "@/data/profile";
import { CHAPTER_ORDER, type ChapterId, stage, subscribeStage } from "@/lib/stage";

const TITLES: Record<ChapterId, string> = {
  hero: "→ GET /you",
  about: "⇄ handshaking…",
  projects: "⚙ routing /0",
  skills: "⛁ querying db…",
  contact: "✓ 200 OK",
};

/**
 * Tab browser ikut jadi bagian konsep:
 * - judul tab = status request di hop yang lagi aktif
 * - favicon digambar ulang: 5 kotak = 5 hop, yang udah dilewati nyala
 * - tab ditinggal → "connection idle", balik lagi → "reconnected"
 */
export function TabPresence() {
  useEffect(() => {
    const original = document.title;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    const icon = link;
    const prevIcon = icon.href;
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
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = away ? "#3b2bff" : k <= i ? "#c6ff00" : "#2b2b2b";
        ctx.fillRect(3 + (k % 3) * 9, k < 3 ? 6 : 17, 8, 8);
      }
      icon.href = c.toDataURL("image/png");
    };

    const title = () => {
      if (away) {
        document.title = "⚠ connection idle… come back";
        return;
      }
      const id = stage.chapter ?? "hero";
      const label = id === "projects" ? `${TITLES.projects}${stage.project + 1}` : TITLES[id];
      document.title = `${label} · ${profile.name}`;
    };

    const update = () => {
      title();
      draw();
    };

    const vis = () => {
      window.clearTimeout(timer);
      away = document.hidden;
      if (!away) {
        document.title = `↻ reconnected · ${profile.name}`;
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
      icon.href = prevIcon;
    };
  }, []);

  return null;
}
