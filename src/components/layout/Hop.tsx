import { Reassemble } from "@/components/fx/Reassemble";
import { CHAPTER_ORDER, CHAPTERS, type ChapterId } from "@/lib/stage";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Judul bab = satu hop di perjalanan request.
 * Nomor hop + nama raksasa (hurufnya dateng sebagai paket) + baris meta.
 * Baris meta = [data-node]: titik yang disambungin jalur PCB (CircuitTrace).
 */
export function HopHeading({ id, titleId }: { id: ChapterId; titleId: string }) {
  const c = CHAPTERS[id];
  const i = CHAPTER_ORDER.indexOf(id);
  return (
    <header>
      <p data-node className="panel inline-flex flex-wrap gap-x-3 text-small">
        <span className="text-accent font-bold">HOP {pad(i + 1)}/{pad(CHAPTER_ORDER.length)}</span>
        <span>{c.layer}</span>
        <span className="text-dim">{c.addr}</span>
        <span className="text-dim">+{c.ms}ms</span>
      </p>
      <h2 id={titleId} className="cut display mt-8 text-[clamp(2rem,9.5vw,11rem)]">
        <Reassemble text={c.label.toUpperCase()} />
      </h2>
    </header>
  );
}
