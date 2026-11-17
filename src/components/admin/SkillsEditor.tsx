"use client";

import { useState } from "react";
import { btn } from "./ui";

type Row = { key: number; name: string; items: string };
let k = 0;

/**
 * Editor skill per grup (baris = grup, urutan = urutan di situs).
 * Hasilnya diserialisasi ke <textarea name="skills"> tersembunyi dengan format
 * "Grup: item, item" yang dibaca Server Action saveSkills.
 */
export function SkillsEditor({ initial }: { initial: { name: string; items: string[] }[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.length ? initial.map((g) => ({ key: k++, name: g.name, items: g.items.join(", ") })) : [{ key: k++, name: "", items: "" }],
  );
  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) =>
    setRows((rs) => {
      const j = i + d;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  const serialized = rows
    .filter((r) => r.name.trim() && r.items.trim())
    .map((r) => `${r.name.trim()}: ${r.items}`)
    .join("\n");

  return (
    <div className="space-y-3">
      <textarea name="skills" value={serialized} readOnly hidden />
      {rows.map((r, i) => {
        const chips = r.items
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return (
          <fieldset key={r.key} className="border border-line p-3">
            <legend className="sr-only">Group {i + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
              <label className="text-small">
                <span className="text-ash">Group</span>
                <input
                  value={r.name}
                  onChange={(e) => set(r.key, { name: e.target.value })}
                  placeholder="Frontend"
                  className="mt-1.5 block w-full border border-line bg-ink px-3 py-2 focus:border-acid focus:outline-none"
                />
              </label>
              <label className="text-small">
                <span className="text-ash">Items (comma separated)</span>
                <input
                  value={r.items}
                  onChange={(e) => set(r.key, { items: e.target.value })}
                  placeholder="React, Next.js, Tailwind CSS"
                  className="mt-1.5 block w-full border border-line bg-ink px-3 py-2 focus:border-acid focus:outline-none"
                />
              </label>
              <div className="flex items-end gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={btn("ghost", "sm")} aria-label={`Move ${r.name || "group"} up`}>
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  className={btn("ghost", "sm")}
                  aria-label={`Move ${r.name || "group"} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  disabled={rows.length === 1}
                  className={btn("danger", "sm")}
                  aria-label={`Remove ${r.name || "group"}`}
                >
                  ✕
                </button>
              </div>
            </div>
            {chips.length > 0 && (
              <ul aria-label="Preview" className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((c, j) => (
                  <li key={`${c}-${j}`} className="border border-line px-2 py-0.5 text-micro text-ash">
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
        );
      })}
      <button type="button" onClick={() => setRows((rs) => [...rs, { key: k++, name: "", items: "" }])} className={btn("ghost", "sm")}>
        + Add group
      </button>
    </div>
  );
}
