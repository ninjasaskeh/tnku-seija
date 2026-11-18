import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CONTENT_TAG } from "./content";
import { db } from "./db";

export type Reference = { kind: "public" | "friend" | "other"; names: string[]; note: string };

export const REFERENCE_KINDS = ["public", "friend", "other"] as const;

/**
 * Easter egg AI terminal (tokoh publik / temen) yang aktif. Di-cache bareng konten
 * (tag "content"), jadi tiap admin nyimpen perubahan, prompt chat ikut ke-refresh.
 * Gagal baca DB → kosong (chat tetep jalan tanpa easter egg).
 */
export async function getReferences(): Promise<Reference[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("days");
  try {
    const rows = await db().reference.findMany({
      where: { enabled: true },
      orderBy: { id: "asc" },
      select: { kind: true, names: true, note: true },
    });
    return rows.map((r) => ({
      kind: (REFERENCE_KINDS as readonly string[]).includes(r.kind) ? (r.kind as Reference["kind"]) : "other",
      names: r.names,
      note: r.note,
    }));
  } catch (err) {
    console.warn("[references] nggak bisa dibaca:", (err as Error).message);
    return [];
  }
}
