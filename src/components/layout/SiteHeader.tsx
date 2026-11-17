"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useContent } from "@/components/ContentProvider";
import { nav } from "@/data/profile";
import { calm, initCalm, setCalm, subscribeCalm } from "@/lib/calm";
import { CHAPTERS, stage, subscribeStage } from "@/lib/stage";

/**
 * Header = address bar. Path-nya ikut hop yang lagi aktif (GET yourname.dev/handshake).
 * Tombol "Calm" di kanan matiin efek rame (lihat src/lib/calm.ts).
 * Stripnya transparan; cuma address bar + menu yang punya latar, biar scene 3D tetep keliatan.
 */
export function SiteHeader() {
  const { profile } = useContent();
  const chapter = useSyncExternalStore(
    subscribeStage,
    () => stage.chapter,
    () => null,
  );
  const path = chapter && chapter !== "hero" ? CHAPTERS[chapter].label.toLowerCase() : "you";
  const done = chapter === "contact";
  const quiet = useSyncExternalStore(
    subscribeCalm,
    () => calm.on,
    () => false,
  );
  useEffect(initCalm, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div className="flex h-14 items-center justify-between gap-2 px-2 sm:gap-3 sm:px-6">
        <a
          href="#top"
          aria-label={`${profile.name}, back to top`}
          className="panel line-fg pointer-events-auto flex min-w-0 items-center gap-2 border px-1.5 py-1 text-small sm:px-2"
        >
          <span aria-hidden="true" className={`size-2 shrink-0 max-sm:hidden ${done ? "bg-(--stage-fg)" : "bg-accent"}`} />
          <span aria-hidden="true" className="method shrink-0">
            {done ? "200" : "GET"}
          </span>
          <span aria-hidden="true" className="truncate max-sm:hidden">
            <span className="text-dim max-sm:hidden">{profile.domain}</span>/{path}
          </span>
        </a>
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <nav aria-label="Main" className="panel px-1.5 py-1 sm:px-2">
            <ul className="flex gap-1.5 text-micro min-[360px]:gap-2 sm:gap-6 sm:text-small">
              {nav.map((n, i) => (
                <li key={n.href}>
                  <a href={n.href} className="py-2 underline-offset-4 hover:underline">
                    <span aria-hidden="true" className="text-accent max-md:hidden">
                      {String(i + 2).padStart(2, "0")}{" "}
                    </span>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            aria-pressed={quiet}
            onClick={() => setCalm(!quiet)}
            data-cursor="FX"
            title="Calm mode: turn off busy effects"
            className={`line-fg flex items-center gap-1.5 border px-2 py-1 text-micro max-sm:py-2 sm:text-small ${quiet ? "bg-(--stage-fg) text-(--stage-dark)" : "panel hover:border-current"}`}
          >
            <span aria-hidden="true" className={`block size-2 ${quiet ? "bg-current" : "border border-current"}`} />
            <span className="max-sm:sr-only">Calm</span>
          </button>
        </div>
      </div>
    </header>
  );
}
