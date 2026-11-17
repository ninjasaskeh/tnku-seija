import { Sparkline } from "./charts";
import { cx } from "./ui";

/**
 * Stat tile: label · angka (warna teks, bukan warna data) · delta vs periode sebelumnya · tren.
 * upIsGood: naik itu kabar baik (kunjungan) atau buruk (biaya) → nentuin warna delta.
 */
export function StatTile({
  label,
  value,
  current,
  previous,
  trend,
  upIsGood = true,
  periodLabel,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  trend?: number[];
  upIsGood?: boolean;
  periodLabel: string;
}) {
  const diff = current - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? null : 0;
  const good = diff === 0 ? null : diff > 0 === upIsGood;
  const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "■";
  const deltaText = pct === null ? "new" : `${diff > 0 ? "+" : ""}${pct}%`;

  return (
    <div className="flex flex-col gap-2 bg-ink p-4">
      <p className="text-micro text-ash">{label}</p>
      <p className="font-display text-[2rem] font-bold leading-none tracking-tight text-paper">{value}</p>
      <p className="text-micro">
        <span className={cx("font-bold", good === null ? "text-ash" : good ? "text-acid" : "text-violet")}>
          <span aria-hidden="true">{arrow}</span> {deltaText}
        </span>{" "}
        <span className="text-ash">vs previous {periodLabel}</span>
      </p>
      {trend ? <Sparkline values={trend} label={`${label} per day`} /> : <div aria-hidden="true" className="h-8" />}
    </div>
  );
}
