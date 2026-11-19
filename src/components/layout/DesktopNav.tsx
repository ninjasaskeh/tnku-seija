"use client";

import { useEffect, useRef } from "react";
import { nav } from "@/data/profile";
import { calm } from "@/lib/calm";
import { gsap, MOTION_OK } from "@/lib/gsap";
import { CHAPTER_ORDER, CHAPTERS, type ChapterId } from "@/lib/stage";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Menu layar lebar (lg+) ala traceroute:
 * - hop yang udah dilewatin warna penuh, hop aktif ditandai `aria-current` + "packet", hop yang belum = redup.
 * - "packet" = satu batang di bawah link aktif yang lompat patah-patah (steps) tiap ganti hop.
 *   Calm mode / reduced motion: langsung pindah tanpa animasi. Di hero (nggak ada di nav) packet ngumpet.
 * - hover/fokus: tooltip info router (layer · alamat · ms) dari CHAPTERS. Angkanya dekorasi, jadi aria-hidden.
 * Lebar link nggak pernah berubah antar state (nggak ada bold/padding), biar packet & layout nggak goyang.
 */
export function DesktopNav({ chapter }: { chapter: ChapterId | null }) {
  const list = useRef<HTMLUListElement>(null);
  const packet = useRef<HTMLSpanElement>(null);
  const shown = useRef(false);
  const at = chapter ? CHAPTER_ORDER.indexOf(chapter) : -1;

  useEffect(() => {
    const ul = list.current;
    const pk = packet.current;
    if (!ul || !pk) return;

    const place = (animate: boolean) => {
      const a = ul.querySelector<HTMLElement>("a[aria-current]");
      if (!a) {
        gsap.to(pk, { autoAlpha: 0, duration: 0, overwrite: true });
        shown.current = false;
        return;
      }
      const u = ul.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      // animasi cuma kalau packet udah keliatan sebelumnya (dari hero langsung muncul di tempat)
      const move = animate && shown.current && !calm.on && window.matchMedia(MOTION_OK).matches;
      gsap.to(pk, {
        x: r.left - u.left,
        width: r.width,
        autoAlpha: 1,
        duration: move ? 0.42 : 0,
        ease: "steps(6)",
        overwrite: true,
      });
      shown.current = true;
    };

    place(true);
    // lebar link berubah pas font selesai dimuat / jendela di-resize → taruh ulang tanpa animasi
    const ro = new ResizeObserver(() => place(false));
    ro.observe(ul);
    return () => ro.disconnect();
  }, [chapter]);

  return (
    <nav aria-label="Main" className="panel px-2 py-1">
      <ul ref={list} className="relative flex gap-6 text-small">
        {nav.map((n, i) => {
          const id = n.href.slice(1) as ChapterId;
          const hop = CHAPTERS[id];
          const idx = CHAPTER_ORDER.indexOf(id);
          const here = idx === at;
          const ahead = idx > at;
          const last = i === nav.length - 1;
          return (
            <li key={n.href} className="group relative">
              <a
                href={n.href}
                aria-current={here ? "location" : undefined}
                className={`block py-2 underline-offset-4 transition-colors duration-200 hover:underline focus-visible:underline aria-[current]:hover:no-underline ${ahead ? "text-dim hover:text-(--stage-fg)" : ""}`}
              >
                <span aria-hidden="true" className="text-accent">
                  {pad(i + 2)}{" "}
                </span>
                {n.label}
              </a>
              {hop && (
                <span
                  aria-hidden="true"
                  className={`panel line-fg pointer-events-none invisible absolute top-full mt-2.5 border px-2 py-1 text-micro whitespace-nowrap opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 motion-reduce:transition-none ${last ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                >
                  <span className="text-accent">{hop.layer}</span>
                  <span className="text-dim">
                    {" · "}
                    {hop.addr} · {hop.ms}ms{here ? " · you are here" : ""}
                  </span>
                </span>
              )}
            </li>
          );
        })}
        {/* packet: batang di bawah link aktif, posisinya diatur GSAP lewat transform (x) + width */}
        <span
          ref={packet}
          aria-hidden="true"
          className="bg-accent pointer-events-none invisible absolute -bottom-0.5 left-0 h-0.5 w-0"
        />
      </ul>
    </nav>
  );
}
