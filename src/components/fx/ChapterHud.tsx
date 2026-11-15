"use client";

import { useSyncExternalStore } from "react";
import { CHAPTER_ORDER, CHAPTERS, stage, subscribeStage } from "@/lib/stage";

/** Indeks bab di kanan + nama formasi kubus yang lagi aktif. Dekorasi → aria-hidden, layar lebar aja. */
export function ChapterHud() {
  const chapter = useSyncExternalStore(
    subscribeStage,
    () => stage.chapter,
    () => null,
  );
  const shape = useSyncExternalStore(
    subscribeStage,
    () => stage.shape,
    () => "cube",
  );

  return (
    <div aria-hidden="true" className="cut pointer-events-none fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 text-micro xl:block">
      <ol className="space-y-2 text-right">
        {CHAPTER_ORDER.map((id, i) => (
          <li key={id} className={id === chapter ? "font-bold" : "opacity-50"}>
            {CHAPTERS[id].label.toUpperCase()} {String(i + 1).padStart(2, "0")} {id === chapter ? "■" : "□"}
          </li>
        ))}
      </ol>
      <p className="mt-6 text-right opacity-70">
        FORM:{shape.toUpperCase()}
        <br />
        4096 BLK
      </p>
    </div>
  );
}
