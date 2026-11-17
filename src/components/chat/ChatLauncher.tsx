"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useContent } from "@/components/ContentProvider";
import { Terminal } from "@/components/fx/Terminal";
import { useBooted } from "@/lib/boot";
import { useChat } from "./ChatProvider";

/** Ikon pixel orisinal: gelembung chat berisi prompt ">_". Warna = currentColor. */
const GLYPH = [
  ".#########.",
  "#.........#",
  "#.#.......#",
  "#..#......#",
  "#.#..####.#",
  "#.........#",
  ".##.######.",
  ".#.........",
  "#..........",
];

function ChatGlyph({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 11 9" shapeRendering="crispEdges" className={className}>
      {GLYPH.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" /> : null,
        ),
      )}
    </svg>
  );
}

/**
 * Tombol chat mengambang ("Socket is open") di pojok kanan bawah, ada di seluruh halaman.
 * Buka panel berisi terminal yang sama dengan di section Handshake (state dari ChatProvider).
 * - Warnanya ikut warna hop (bg-accent = --stage-light di atas --stage-dark).
 * - Disembunyiin selama boot screen & selama terminal inline di Handshake keliatan
 *   (biar nggak ada dua terminal di layar), kecuali panelnya lagi kebuka.
 * - Esc nutup panel; fokus pindah ke input pas buka, balik ke tombol pas tutup.
 * - Ada titik notifikasi kalau jawaban baru masuk selagi panel ketutup.
 */
export function ChatLauncher() {
  const booted = useBooted();
  const { profile } = useContent();
  const { lines, busy } = useChat();
  const [open, setOpen] = useState(false);
  const [inlineVisible, setInlineVisible] = useState(false);
  const [seen, setSeen] = useState(lines.length);
  const linesLen = useRef(lines.length);
  const button = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useEffect(() => {
    linesLen.current = lines.length;
  }, [lines]);

  // terminal inline di Handshake keliatan → tombol ngumpet
  useEffect(() => {
    const el = document.querySelector("[data-inline-terminal]");
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInlineVisible(!!e?.isIntersecting);
        setSeen(linesLen.current); // keliatan / baru ditinggalin = udah kebaca
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // jawaban baru selagi panel ketutup (dan terminal inline nggak keliatan) → titik notifikasi.
  // "seen" = jumlah baris waktu terakhir obrolannya keliatan; unread dihitung, bukan disimpen.
  const unread = !open && !inlineVisible && !busy && lines.length > seen && lines.at(-1)?.kind === "ai";

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSeen(linesLen.current);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!booted) return null;
  const hidden = inlineVisible && !open;

  return (
    <>
      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
          data-lenis-prevent
          className="chat-pop fixed inset-x-2 bottom-20 z-[60] flex h-[min(70svh,560px)] flex-col border border-line bg-ink text-paper shadow-[0_0_0_2px_var(--stage-dark),0_24px_60px_rgb(0_0_0/0.6)] sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[400px]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <div className="min-w-0">
              <h2 id={`${panelId}-title`} className="flex items-center gap-2 font-bold">
                <span aria-hidden="true" className={`size-2 ${busy ? "animate-pulse bg-acid" : "bg-acid"}`} />
                Socket is open
              </h2>
              <p className="truncate text-micro text-ash">
                wss://{profile.domain}/you · {busy ? "streaming…" : "AI online"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSeen(lines.length);
                button.current?.focus();
              }}
              className="grid size-8 shrink-0 place-items-center border border-line text-ash hover:border-acid hover:text-acid"
              aria-label="Close chat"
            >
              ✕
            </button>
          </header>
          <div className="min-h-0 flex-1">
            <Terminal variant="panel" inputRef={input} />
          </div>
        </section>
      )}

      <button
        ref={button}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setSeen(lines.length);
        }}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-hidden={hidden || undefined}
        tabIndex={hidden ? -1 : 0}
        data-cursor={open ? "CLOSE" : "CHAT"}
        className={`bg-accent fixed right-4 bottom-4 z-[60] flex h-14 items-center gap-2.5 px-4 font-bold shadow-[0_0_0_2px_var(--stage-dark)] transition-[opacity,translate] duration-200 hover:-translate-y-0.5 sm:right-6 sm:bottom-6 ${
          hidden ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"
        }`}
      >
        {open ? (
          <span aria-hidden="true" className="grid size-6 place-items-center text-lg leading-none">
            ✕
          </span>
        ) : (
          <ChatGlyph className="h-[18px] w-[22px]" />
        )}
        <span className="text-small max-sm:sr-only">{open ? "Close" : "Ask me"}</span>
        {!open && <span className="sr-only">: open chat (Socket is open)</span>}
        {unread && !open && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 size-3 animate-pulse bg-(--stage-fg) ring-2 ring-(--stage-dark)"
          />
        )}
      </button>
    </>
  );
}
