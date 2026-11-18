"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
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
 * - Esc nutup panel; fokus balik ke tombol pas tutup. Desktop: input langsung fokus pas buka.
 * - HP: jadi bottom sheet + backdrop (tap luar = tutup). Posisi & tinggi ngikutin
 *   visualViewport, jadi sheet selalu nangkring tepat di atas keyboard virtual (iOS & Android).
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
  const panel = useRef<HTMLElement>(null);
  const panelId = useId();

  const close = () => {
    setOpen(false);
    setSeen(linesLen.current);
    button.current?.focus({ preventScroll: true });
  };

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
    // HP: jangan langsung munculin keyboard (biar pesan awal kebaca dulu); desktop: langsung ketik
    if (window.matchMedia("(pointer: fine)").matches) input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keyboard virtual di HP: visualViewport nyusut, tapi elemen `fixed` nempel ke layout viewport
  // (ketutup keyboard). Tinggi keyboard & area yang keliatan ditulis ke CSS var di panel → sheet
  // pindah ke atas keyboard & melebar ngisi sisa layar. Langsung ke DOM, bukan state React.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = panel.current;
    if (!open || !vv || !el) return;
    let wasOpen = false;
    const update = () => {
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      el.style.setProperty("--kb", `${kb}px`);
      el.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
      const kbOpen = kb > 80;
      el.dataset.kb = kbOpen ? "open" : "closed";
      if (kbOpen !== wasOpen) {
        wasOpen = kbOpen;
        const log = el.querySelector<HTMLElement>("[role=log]");
        requestAnimationFrame(() => log && (log.scrollTop = log.scrollHeight));
      }
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open]);

  if (!booted) return null;
  const hidden = inlineVisible && !open;

  return (
    <>
      {open && (
        // HP: backdrop gelap, tap = tutup; touch-none biar halaman di belakang nggak ikut ke-scroll
        <div
          aria-hidden="true"
          onClick={close}
          className="chat-fade fixed inset-0 z-[59] touch-none bg-ink/60 sm:hidden"
        />
      )}
      {open && (
        <section
          ref={panel}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
          data-lenis-prevent
          style={{ "--kb": "0px", "--vvh": "100svh" } as CSSProperties}
          className={[
            "chat-pop fixed z-[60] flex flex-col bg-ink text-paper",
            // HP: bottom sheet di atas keyboard; tinggi ~50% layar, waktu ngetik ngisi area yang keliatan
            "inset-x-0 bottom-(--kb) h-[min(52svh,26rem)] border-t border-line pb-[env(safe-area-inset-bottom)]",
            "data-[kb=open]:h-[calc(var(--vvh)-0.75rem)] data-[kb=open]:pb-0",
            // desktop: kartu di atas tombol
            "sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[min(70svh,560px)] sm:w-[400px] sm:border sm:pb-0 sm:shadow-[0_0_0_2px_var(--stage-dark),0_24px_60px_rgb(0_0_0/0.6)]",
          ].join(" ")}
        >
          <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 bg-line sm:hidden" />
          <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 sm:px-4 sm:py-2.5">
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
              onClick={close}
              className="grid size-9 shrink-0 place-items-center border border-line text-ash hover:border-acid hover:text-acid sm:size-8"
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
        className={`bg-accent fixed right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[60] flex size-12 items-center justify-center font-bold shadow-[0_0_0_2px_var(--stage-dark)] transition-[opacity,translate] duration-200 hover:-translate-y-0.5 sm:right-6 sm:bottom-6 sm:h-14 sm:w-auto sm:gap-2.5 sm:px-4 ${
          hidden ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"
        } ${open ? "max-sm:hidden" : ""}`}
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
