"use client";

import { useMemo, useRef, useState } from "react";
import type { SkillGroup } from "@/lib/content-types";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";


/**
 * Query builder beneran: klik layer buat ngubah klausa WHERE, tabel hasilnya ikut berubah.
 * Kosong (nggak ada filter) = semua layer.
 * Hasil query diumumin ke screen reader lewat role="status".
 */
export function SkillQuery({ skills }: { skills: SkillGroup[] }) {
  const GROUPS = useMemo(() => skills.map((s) => s.group), [skills]);
  const ROWS = useMemo(() => skills.flatMap((s) => s.items.map((name) => ({ name, layer: s.group }))), [skills]);
  const [on, setOn] = useState<string[]>(GROUPS);
  const table = useRef<HTMLTableSectionElement>(null);
  const rows = ROWS.filter((r) => on.includes(r.layer));
  const all = on.length === GROUPS.length;

  // semua aktif + klik satu = "cuma itu"; setelahnya klik = tambah/kurang
  const toggle = (g: string) =>
    setOn((prev) => {
      if (prev.length === GROUPS.length) return [g];
      const next = prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g];
      return next.length ? GROUPS.filter((x) => next.includes(x)) : GROUPS;
    });

  // baris "di-fetch" ulang tiap filter berubah: muncul patah-patah dari atas
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        if (!table.current) return;
        gsap.from(table.current.children, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.28,
          ease: "steps(5)",
          stagger: 0.035,
          clearProps: "clipPath",
        });
      });
      return () => mm.revert();
    },
    { dependencies: [on.join()], scope: table },
  );

  const where = all ? "" : ` WHERE layer IN (${on.map((g) => `'${g.toLowerCase()}'`).join(", ")})`;

  return (
    <div className="panel line-fg border">
      <div className="line-fg border-b px-3 py-3 text-micro sm:px-4 sm:text-small">
        <p aria-hidden="true">
          <span className="text-dim">db=&gt; </span>
          SELECT name, layer FROM skills
          <span className="font-bold underline decoration-dashed underline-offset-4">{where}</span>;
          <span className="caret ml-1" />
        </p>
        <fieldset className="mt-3 flex flex-wrap items-center gap-2">
          <legend className="text-dim float-left mr-2">Filter layer:</legend>
          {GROUPS.map((g) => {
            const pressed = on.includes(g) && !all;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={pressed}
                onClick={() => toggle(g)}
                data-cursor="WHERE"
                className={`border px-2.5 py-1 font-bold ${pressed ? "bg-(--stage-fg) text-(--stage-dark)" : "line-fg hover:border-current"}`}
              >
                {g.toLowerCase()}
              </button>
            );
          })}
          {!all && (
            <button type="button" onClick={() => setOn(GROUPS)} className="text-dim px-1 underline underline-offset-4">
              reset
            </button>
          )}
        </fieldset>
      </div>

      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Skills, filtered by layer</caption>
        <thead className="text-dim text-micro sm:text-small">
          <tr className="line-fg border-b">
            <th scope="col" className="w-9 py-2 pl-3 pr-1 font-normal sm:w-14 sm:px-4">
              id
            </th>
            <th scope="col" className="px-2 py-2 font-normal">
              name
            </th>
            <th scope="col" className="py-2 pl-2 pr-3 text-right font-normal sm:px-4">
              layer
            </th>
          </tr>
        </thead>
        <tbody ref={table}>
          {rows.map((r) => (
            <tr key={r.name} className="line-fg border-b border-dashed last:border-0">
              <td className="text-dim py-1.5 pl-3 pr-1 text-micro tabular-nums sm:px-4 sm:text-small">
                {String(ROWS.indexOf(r) + 1).padStart(2, "0")}
              </td>
              <td className="display px-2 py-1.5 text-[clamp(0.95rem,4.8vw,1.35rem)] [overflow-wrap:anywhere] sm:text-h3">{r.name}</td>
              <td className="py-1.5 pl-2 pr-3 text-right text-micro sm:px-4 sm:text-small">{r.layer.toLowerCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p role="status" className="line-fg text-dim border-t px-4 py-2 text-small">
        ({rows.length} {rows.length === 1 ? "row" : "rows"}, 0.00{(rows.length % 7) + 2} sec)
      </p>
    </div>
  );
}
