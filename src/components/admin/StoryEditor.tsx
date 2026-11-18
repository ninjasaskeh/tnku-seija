"use client";

import { useState } from "react";
import { btn } from "./ui";

type Beat = { key: number; text: string };
let k = 0;
const MAX_BEATS = 8;
const MAX_CHARS = 600;

/**
 * Editor cerita Keep-Alive: satu kotak = satu "beat" (paragraf) di timeline situs.
 * Tiap kotak dikirim sebagai input bernama "beat", urutannya = urutan di situs.
 */
export function StoryEditor({ initial }: { initial: string[] }) {
  const [beats, setBeats] = useState<Beat[]>(() =>
    (initial.length ? initial : [""]).map((text) => ({ key: k++, text })),
  );
  const set = (key: number, text: string) => setBeats((bs) => bs.map((b) => (b.key === key ? { ...b, text } : b)));
  const move = (i: number, d: -1 | 1) =>
    setBeats((bs) => {
      const j = i + d;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <div className="space-y-4">
      <ol className="relative space-y-4">
        <span aria-hidden="true" className="wire-y absolute bottom-3 left-[5px] top-3 text-ash opacity-40" />
        {beats.map((b, i) => (
          <li key={b.key} className="relative grid grid-cols-[1rem_1fr] gap-x-3">
            <span aria-hidden="true" className="mt-2.5 block size-3 bg-acid" />
            <div className="border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`beat-${b.key}`} className="text-micro font-bold tracking-wider text-acid">
                  BEAT {String(i + 1).padStart(2, "0")}
                  {i === 0 && <span className="ml-2 font-normal text-ash">shown big</span>}
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className={btn("ghost", "sm")}
                    aria-label={`Move beat ${i + 1} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === beats.length - 1}
                    className={btn("ghost", "sm")}
                    aria-label={`Move beat ${i + 1} down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeats((bs) => bs.filter((x) => x.key !== b.key))}
                    disabled={beats.length === 1}
                    className={btn("danger", "sm")}
                    aria-label={`Remove beat ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <textarea
                id={`beat-${b.key}`}
                name="beat"
                value={b.text}
                onChange={(e) => set(b.key, e.target.value)}
                maxLength={MAX_CHARS}
                rows={i === 0 ? 4 : 3}
                placeholder={
                  ["Where it started: the first thing I built…", "What came next…", "Why I keep going…"][i] ??
                  "Another chapter…"
                }
                className="mt-2 block w-full resize-y border border-line bg-ink px-3 py-2 leading-relaxed placeholder:text-ash/50 focus:border-acid focus:outline-none"
              />
              <p className="mt-1 text-right text-micro text-ash tabular-nums">
                {b.text.length}/{MAX_CHARS}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => setBeats((bs) => [...bs, { key: k++, text: "" }])}
        disabled={beats.length >= MAX_BEATS}
        className={btn("ghost", "sm")}
      >
        + Add beat {beats.length >= MAX_BEATS && `(max ${MAX_BEATS})`}
      </button>
    </div>
  );
}
