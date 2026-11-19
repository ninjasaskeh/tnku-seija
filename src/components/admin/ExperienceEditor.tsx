"use client";

import { useState } from "react";
import { EXPERIENCE_KINDS, type Experience } from "@/lib/content-types";
import { SelectField } from "./Select";
import { btn } from "./ui";

type Entry = {
  key: number;
  company: string;
  role: string;
  kind: string;
  location: string;
  start: string;
  end: string;
  summary: string;
  highlights: string;
  stack: string;
  url: string;
};
let k = 0;
const MAX = 12;
const KIND_OPTIONS = EXPERIENCE_KINDS.map((kind) => ({ value: kind, label: kind }));

const blank = (): Entry => ({
  key: k++,
  company: "",
  role: "",
  kind: "full-time",
  location: "",
  start: "",
  end: "",
  summary: "",
  highlights: "",
  stack: "",
  url: "",
});

const inputCls =
  "mt-1.5 block w-full border border-line bg-ink px-3 py-2 text-paper placeholder:text-ash/50 transition-colors hover:border-ash/60 focus:border-acid focus:outline-none";

/**
 * Editor riwayat kerja (hop Logs): satu kartu = satu baris access.log, urutan kartu = urutan di situs
 * (taruh yang terbaru paling atas). Semua kartu ngirim input dengan nama yang sama, jadi
 * saveExperience baca pake form.getAll(nama) dan nyocokin per indeks. Makanya nggak ada checkbox
 * (checkbox kosong nggak ikut terkirim, indeksnya bakal geser): "masih kerja" = End dikosongin.
 */
export function ExperienceEditor({ initial }: { initial: Experience[] }) {
  const [entries, setEntries] = useState<Entry[]>(() =>
    initial.length
      ? initial.map((e) => ({
          key: k++,
          company: e.company,
          role: e.role,
          kind: e.kind,
          location: e.location,
          start: e.start,
          end: e.end ?? "",
          summary: e.summary,
          highlights: e.highlights.join("\n"),
          stack: e.stack.join(", "),
          url: e.url ?? "",
        }))
      : [blank()],
  );
  const set = (key: number, patch: Partial<Entry>) =>
    setEntries((es) => es.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const move = (i: number, d: -1 | 1) =>
    setEntries((es) => {
      const j = i + d;
      if (j < 0 || j >= es.length) return es;
      const next = [...es];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <div className="space-y-4">
      {entries.map((e, i) => {
        const id = `job-${e.key}`;
        const field = (name: keyof Entry) => ({
          id: `${id}-${name}`,
          name,
          value: e[name],
          onChange: (ev: { target: { value: string } }) => set(e.key, { [name]: ev.target.value }),
        });
        return (
          <fieldset key={e.key} className="border border-line p-3 sm:p-4">
            <legend className="sr-only">Entry {i + 1}</legend>
            <div className="flex items-center justify-between gap-2">
              <p className="text-micro font-bold tracking-wider text-acid">
                LINE {String(i + 1).padStart(2, "0")}
                <span className="ml-2 font-normal text-ash">
                  {e.end ? "301 moved" : e.start ? "200 OK · current" : "new"}
                </span>
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className={btn("ghost", "sm")}
                  aria-label={`Move entry ${i + 1} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === entries.length - 1}
                  className={btn("ghost", "sm")}
                  aria-label={`Move entry ${i + 1} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setEntries((es) => (es.length > 1 ? es.filter((x) => x.key !== e.key) : [blank()]))}
                  className={btn("danger", "sm")}
                  aria-label={`Remove entry ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 text-small sm:grid-cols-2">
              <label htmlFor={`${id}-role`}>
                <span className="text-ash">
                  Role <span className="text-acid">*</span>
                </span>
                <input {...field("role")} maxLength={80} placeholder="Fullstack Developer" className={inputCls} />
              </label>
              <label htmlFor={`${id}-company`}>
                <span className="text-ash">
                  Company <span className="text-acid">*</span>
                </span>
                <input {...field("company")} maxLength={80} placeholder="Acme Inc." className={inputCls} />
              </label>
              {/* react-select selalu render tepat 1 input hidden name="kind", jadi indeks getAll tetep sejajar */}
              <SelectField label="Type" name="kind" options={KIND_OPTIONS} defaultValue={e.kind} />
              <label htmlFor={`${id}-location`}>
                <span className="text-ash">Location</span>
                <input {...field("location")} maxLength={80} placeholder="Jakarta · Hybrid" className={inputCls} />
              </label>
              <label htmlFor={`${id}-start`}>
                <span className="text-ash">
                  Start <span className="text-acid">*</span>
                </span>
                <input {...field("start")} type="month" placeholder="2024-03" pattern="\d{4}-\d{2}" className={inputCls} />
              </label>
              <label htmlFor={`${id}-end`}>
                <span className="text-ash">End</span>
                <input {...field("end")} type="month" placeholder="empty = still here" pattern="\d{4}-\d{2}" className={inputCls} />
                <span className="mt-1 block text-micro text-ash">Leave empty if you still work there.</span>
              </label>
              <label htmlFor={`${id}-summary`} className="sm:col-span-2">
                <span className="text-ash">Summary</span>
                <textarea
                  {...field("summary")}
                  rows={2}
                  maxLength={600}
                  placeholder="What the team builds and what you own there."
                  className={`${inputCls} resize-y leading-relaxed`}
                />
              </label>
              <label htmlFor={`${id}-highlights`} className="sm:col-span-2">
                <span className="text-ash">Highlights (one per line, shown as [ok] lines)</span>
                <textarea
                  {...field("highlights")}
                  rows={3}
                  placeholder={"Cut API p95 from 900ms to 120ms\nLed the move to Next.js"}
                  className={`${inputCls} resize-y leading-relaxed`}
                />
              </label>
              <label htmlFor={`${id}-stack`}>
                <span className="text-ash">Stack (comma separated)</span>
                <input {...field("stack")} placeholder="Next.js, PostgreSQL" className={inputCls} />
              </label>
              <label htmlFor={`${id}-url`}>
                <span className="text-ash">Link</span>
                <input {...field("url")} placeholder="acme.com" className={inputCls} />
              </label>
            </div>
          </fieldset>
        );
      })}
      <button
        type="button"
        onClick={() => setEntries((es) => [...es, blank()])}
        disabled={entries.length >= MAX}
        className={btn("ghost", "sm")}
      >
        + Add entry {entries.length >= MAX && `(max ${MAX})`}
      </button>
    </div>
  );
}
