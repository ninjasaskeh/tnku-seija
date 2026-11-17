import { db } from "@/lib/db";
// sama dengan CHAPTER_ORDER di src/lib/stage.ts (nggak diimport biar route ini nggak narik GSAP)
const CHAPTER_ORDER = ["hero", "about", "projects", "skills", "contact"];

const VISIT_RE = /^[a-z0-9-]{8,64}$/i;
const TYPES = new Set(["view", "hop"]);
const HOPS = new Set<string>(CHAPTER_ORDER);
const MAX_EVENTS_PER_VISIT = 50;

const clip = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);

/**
 * POST /api/track  { visitId, type: "view" | "hop", hop?, path?, referrer?, device? }
 * Analytics anonim: nggak ada cookie, nggak ada IP. visitId = id acak per tab dari client.
 * Selalu balas 204 (beacon nggak butuh jawaban); input aneh dibuang diam-diam.
 */
export async function POST(req: Request) {
  const ok = new Response(null, { status: 204 });
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return ok;
  }
  const visitId = typeof b.visitId === "string" && VISIT_RE.test(b.visitId) ? b.visitId : null;
  const type = typeof b.type === "string" && TYPES.has(b.type) ? b.type : null;
  if (!visitId || !type) return ok;
  const hop = typeof b.hop === "string" && HOPS.has(b.hop) ? b.hop : null;
  if (type === "hop" && !hop) return ok;

  try {
    const prisma = db();
    if ((await prisma.pageEvent.count({ where: { visitId } })) >= MAX_EVENTS_PER_VISIT) return ok;
    await prisma.pageEvent.create({
      data: {
        visitId,
        type,
        hop,
        path: clip(b.path, 200),
        referrer: clip(b.referrer, 120),
        device: b.device === "mobile" || b.device === "desktop" ? b.device : null,
      },
    });
  } catch (e) {
    console.error("[track]", (e as Error).message);
  }
  return ok;
}
