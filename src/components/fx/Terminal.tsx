"use client";

import { type FormEvent, type Ref, useEffect, useId, useRef, useState } from "react";
import { MAX_LEN, useChat } from "@/components/chat/ChatProvider";
import { useContent } from "@/components/ContentProvider";

const QUICK = ["help", "whoami", "traceroute", "ping"];
const ASK = ["What do you build?", "Which stack for APIs?", "Are you open to work?"];

/**
 * Tampilan terminal. State percakapannya di ChatProvider, jadi terminal di section
 * Handshake dan di panel chat mengambang nunjukin obrolan yang sama.
 * variant "panel": chat polos (tanpa bingkai luar, tombol perintah, & contoh pertanyaan), log ngisi tinggi panel.
 */
export function Terminal({
  variant = "inline",
  inputRef,
}: {
  variant?: "inline" | "panel";
  inputRef?: Ref<HTMLInputElement>;
}) {
  const { profile } = useContent();
  const { lines, busy, run } = useChat();
  const [value, setValue] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const panel = variant === "panel";

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [lines]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    run(value);
    setValue("");
  };

  return (
    <div className={panel ? "flex h-full min-h-0 flex-col text-small" : "border border-line bg-ink text-small"}>
      {!panel && (
        <div className="flex items-center justify-between border-b border-line px-4 py-2 text-ash">
          <span className="truncate">visitor@{profile.domain}: ~</span>
          <span className="flex shrink-0 items-center gap-3">
            <span className={busy ? "text-acid" : ""}>{busy ? "streaming…" : "AI online"}</span>
            <span aria-hidden="true" className="flex gap-1.5">
              <i className="size-2 bg-acid" />
              <i className="size-2 bg-volt" />
              <i className="size-2 bg-paper" />
            </span>
          </span>
        </div>
      )}
      <div
        ref={log}
        role="log"
        aria-live="polite"
        aria-busy={busy}
        data-lenis-prevent
        className={
          panel
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
            : "h-72 overflow-y-auto overscroll-contain px-4 py-3"
        }
      >
        {lines.map((l) => (
          <p
            key={l.id}
            className={`whitespace-pre-wrap break-words ${
              l.kind === "err"
                ? "text-violet"
                : l.kind === "in"
                  ? "text-acid"
                  : l.kind === "ai"
                    ? "mb-2 text-paper"
                    : ""
            }`}
          >
            {l.kind === "in" && "$ "}
            {l.kind === "ai" && <span className="text-acid">← </span>}
            {l.text}
            {l.kind === "ai" && busy && l.id === lines[lines.length - 1]?.id && <span className="caret ml-0.5" />}
          </p>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-line px-4 py-2">
        <label htmlFor={inputId} className="text-acid">
          <span aria-hidden="true">$</span>
          <span className="sr-only">Ask a question or type a command</span>
        </label>
        <input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={MAX_LEN}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="ask anything, or: help"
          enterKeyHint="send"
          // 16px di HP: iOS nge-zoom otomatis kalau font input < 16px
          className="min-w-0 flex-1 bg-transparent py-1 text-paper placeholder:text-ash/60 focus:outline-none max-sm:text-base"
        />
        <button
          type="submit"
          disabled={busy}
          className="border border-line px-3 py-1 hover:border-acid hover:text-acid disabled:opacity-40"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
      {/* tombol perintah & contoh pertanyaan cuma di terminal inline; panel = chat polos */}
      {!panel && (
        <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
          {QUICK.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => run(c)}
              className="shrink-0 border border-line px-2 py-1 text-ash hover:border-acid hover:text-acid"
            >
              {c}
            </button>
          ))}
          {ASK.map((q) => (
            <button
              key={q}
              type="button"
              disabled={busy}
              onClick={() => run(q)}
              className="shrink-0 border border-dashed border-line px-2 py-1 text-ash hover:border-acid hover:text-acid disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
