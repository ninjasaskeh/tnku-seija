"use client";

import { type KeyboardEvent, useId, useState } from "react";
import { cx } from "./ui";

/*
 * Grafik admin. Satu seri → nggak pake legend (judul panel udah nyebut isinya).
 * Spesifikasi: batang ≤24px, ujung data bulat 4px & pangkal kotak, celah 2px antar batang,
 * grid/axis garis tipis 1px yang nggak menonjol, teks pake warna teks (bukan warna data),
 * tiap batang punya tooltip (hover & keyboard), dan ada tabel data buat screen reader.
 */

const ACCENT = "var(--color-acid)";
const GRID = "var(--color-line)";

/** Angka sumbu yang "bulet": 0 · ½ · max */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Path batang: pangkal kotak, ujung atas bulat 4px. */
function barPath(x: number, y: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}

export type Point = { label: string; value: number };

export function ColumnChart({
  data,
  unit,
  format = (n) => n.toLocaleString("en-US"),
  height = 180,
}: {
  data: Point[];
  unit: string;
  format?: (n: number) => string;
  height?: number;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const W = 720;
  const padL = 36;
  const padB = 22;
  const H = height;
  const plotW = W - padL;
  const plotH = H - padB - 8;
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(24, Math.max(2, slot - 2));
  const ticks = [0, max / 2, max];
  const y = (v: number) => 8 + plotH - (v / max) * plotH;
  const xLabels = data.length ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : [];

  const onKey = (e: KeyboardEvent) => {
    if (!data.length) return;
    const cur = active ?? data.length - 1;
    if (e.key === "ArrowLeft") setActive(Math.max(0, cur - 1));
    else if (e.key === "ArrowRight") setActive(Math.min(data.length - 1, cur + 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(data.length - 1);
    else return;
    e.preventDefault();
  };

  const a = active !== null ? data[active] : null;
  const total = data.reduce((n, d) => n + d.value, 0);

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full outline-none focus-visible:outline-1 focus-visible:outline-acid"
        role="img"
        tabIndex={0}
        aria-label={`${unit} per day, ${data[0]?.label ?? ""} to ${data.at(-1)?.label ?? ""}. Total ${format(total)}. Use arrow keys to read each day.`}
        aria-describedby={`${id}-table`}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ash text-[11px] tabular-nums">
              {format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const top = y(d.value);
          return (
            <g key={d.label} onPointerEnter={() => setActive(i)}>
              {/* area hover selebar slot penuh, lebih gede dari batangnya */}
              <rect x={padL + i * slot} y={8} width={slot} height={plotH} fill="transparent" />
              <path
                d={barPath(x, top, barW, 8 + plotH - top)}
                fill={active === i ? "var(--color-paper)" : ACCENT}
                opacity={active === null || active === i ? 1 : 0.55}
              />
            </g>
          );
        })}
        {xLabels.map((i) => (
          <text
            key={i}
            x={padL + i * slot + slot / 2}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
            className="fill-ash text-[11px]"
          >
            {data[i]!.label}
          </text>
        ))}
      </svg>

      {a && active !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 border border-line bg-ink px-2 py-1 text-micro shadow-[0_0_0_2px_var(--color-ink)]"
          style={{ left: `${((padL + active * slot + slot / 2) / W) * 100}%` }}
        >
          <p className="font-bold text-paper tabular-nums">
            {format(a.value)} {unit}
          </p>
          <p className="text-ash">{a.label}</p>
        </div>
      )}

      <table id={`${id}-table`} className="sr-only">
        <caption>{unit} per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/**
 * Garis tren mini di stat tile: riwayat abu-abu, titik terakhir (periode sekarang) acid.
 * SVG-nya melar ngikutin lebar kartu (preserveAspectRatio none + garis non-scaling),
 * titik ujungnya elemen HTML biar tetep bulat.
 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <div className="h-8" />;
  const W = 100;
  const H = 32;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 5 - (v / max) * (H - 10)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");
  const [, ly] = pts[pts.length - 1]!;
  return (
    <div className="relative h-8 pr-1" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full overflow-visible" aria-hidden="true">
        <path
          d={d}
          fill="none"
          stroke="var(--color-ash)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.7"
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute right-0 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-acid ring-2 ring-ink"
        style={{ top: `${(ly / H) * 100}%` }}
      />
    </div>
  );
}

/** Daftar batang horizontal (funnel, device, referrer). Nilai ditulis di ujung batang. */
export function BarList({
  rows,
  format = (n) => n.toLocaleString("en-US"),
  emptyLabel = "No data yet.",
}: {
  rows: { label: string; value: number; note?: string }[];
  format?: (n: number) => string;
  emptyLabel?: string;
}) {
  if (!rows.length) return <p className="py-6 text-center text-micro text-ash">{emptyLabel}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="shrink-0 text-paper tabular-nums">
              {format(r.value)}
              {r.note && <span className="ml-1.5 text-ash">{r.note}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 bg-line/50" aria-hidden="true">
            <div
              className={cx("h-full rounded-r-[4px]", r.value ? "bg-acid" : "")}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
