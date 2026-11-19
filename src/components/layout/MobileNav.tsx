"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useContent } from "@/components/ContentProvider";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { nav } from "@/data/profile";
import { lenisRef } from "@/lib/lenis";
import { CHAPTER_ORDER, CHAPTERS, type ChapterId } from "@/lib/stage";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Menu layar kecil (< lg): tombol "Menu" di header buka drawer dari bawah (shadcn Drawer / vaul).
 * Isinya tabel rute ala traceroute: nomor hop, nama, layer; hop yang lagi aktif ditandai.
 * Klik rute → drawer nutup, Lenis jalan lagi, lalu scroll ke section-nya.
 * Selama drawer kebuka Lenis dihentiin biar halaman di belakang nggak ikut kegeser.
 *
 * `noBodyStyles`: tanpa ini, di Safari/iOS vaul ngunci body pake position:fixed → scrollY jadi 0 →
 * ScrollTrigger ngira halaman balik ke atas dan panggung lompat ke hop "hero" di belakang drawer.
 * Kunci scroll-nya cukup dari Radix Dialog (react-remove-scroll) + Lenis yang distop.
 */
export function MobileNav({ chapter }: { chapter: ChapterId | null }) {
  const { profile } = useContent();
  const [open, setOpen] = useState(false);
  const stopped = useRef(false);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (open && !lenis.isStopped) {
      lenis.stop();
      stopped.current = true;
    } else if (!open && stopped.current) {
      lenis.start();
      stopped.current = false;
    }
  }, [open]);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    const lenis = lenisRef.current;
    if (lenis && stopped.current) {
      lenis.start();
      stopped.current = false;
    }
    // tunggu 2 frame: state nutup kepasang & kunci scroll Radix dilepas, ukur ulang Lenis, baru scroll
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (lenis) {
          lenis.resize();
          lenis.scrollTo(href, { offset: -56 });
        } else document.querySelector(href)?.scrollIntoView({ block: "start" });
      }),
    );
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} noBodyStyles>
      <DrawerTrigger
        data-cursor="MENU"
        className="panel line-fg flex items-center gap-2 border px-2.5 py-2 text-micro font-bold hover:border-current"
      >
        <span aria-hidden="true" className="flex w-3 flex-col gap-[3px]">
          <span className="h-px bg-current" />
          <span className="h-px bg-current" />
          <span className="h-px bg-current" />
        </span>
        Menu
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="px-5 pt-3 pb-3">
          <DrawerTitle className="text-small">
            <span className="text-accent">$</span> traceroute {profile.domain}
          </DrawerTitle>
          <DrawerDescription className="text-micro">
            {CHAPTER_ORDER.length} hops max. Pick one to jump there.
          </DrawerDescription>
        </DrawerHeader>

        <nav aria-label="Main" className="min-h-0 overflow-y-auto">
          <ol className="line-fg border-t">
            {nav.map((n, i) => {
              const id = n.href.slice(1) as ChapterId;
              const hop = CHAPTERS[id];
              const here = chapter === id;
              return (
                <li key={n.href} className="line-fg border-b">
                  <a
                    href={n.href}
                    onClick={(e) => go(e, n.href)}
                    aria-current={here ? "location" : undefined}
                    className="grid grid-cols-[2rem_1fr] items-baseline gap-x-3 px-5 py-2.5 active:bg-(--stage-fg)/10"
                  >
                    <span className="text-accent text-small font-bold tabular-nums">{pad(i + 2)}</span>
                    <span className="min-w-0">
                      <span className="display block truncate text-[clamp(1.375rem,6.5vw,2.25rem)]">{n.label}</span>
                      {/* layer di bawah label biar label dapet lebar penuh (EXPERIENCE nggak kepotong);
                          layar pendek (≤700px) cuma nampilin layer hop yang aktif biar semua rute muat */}
                      <span
                        className={`text-dim mt-1 flex items-center gap-2 text-micro ${here ? "" : "[@media(max-height:700px)]:hidden"}`}
                      >
                        {here && <span aria-hidden="true" className="bg-accent block size-2" />}
                        {hop?.layer}
                        {here && <span className="text-accent font-bold">· you are here</span>}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <DrawerFooter className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <DrawerClose className="line-fg border py-2.5 text-small font-bold hover:border-current">Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
