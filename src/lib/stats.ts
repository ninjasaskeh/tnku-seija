import "server-only";
import { priceFor } from "./chat";
import { db } from "./db";

const HOP_ORDER = ["hero", "about", "projects", "skills", "contact"] as const;
const HOP_LABEL: Record<string, string> = {
  hero: "01 Request",
  about: "02 Handshake",
  projects: "03 Routes",
  skills: "04 Query",
  contact: "05 Response",
};

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];
export const parseRange = (v: unknown): Range => (RANGES.includes(Number(v) as Range) ? (Number(v) as Range) : 30);

const DAY = 24 * 3600_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Angka dashboard buat `days` hari terakhir + periode yang sama sebelumnya (buat delta %).
 * Semua dihitung di DB; biaya AI = estimasi dari token × tarif per model.
 */
export async function dashboardStats(days: Range) {
  const prisma = db();
  const now = Date.now();
  const since = new Date(now - days * DAY);
  const prevSince = new Date(now - 2 * days * DAY);

  const [visitDaily, answerDaily, hops, devices, referrers, tokens, sessionsNow, sessionsPrev, recent] = await Promise.all([
    prisma.$queryRaw<{ day: Date; n: number }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(DISTINCT "visitId")::int AS n
      FROM "PageEvent" WHERE type = 'view' AND "createdAt" >= ${prevSince}
      GROUP BY 1`,
    prisma.$queryRaw<{ day: Date; n: number }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS n
      FROM "ChatMessage" WHERE role = 'assistant' AND "createdAt" >= ${prevSince}
      GROUP BY 1`,
    prisma.$queryRaw<{ hop: string; n: number }[]>`
      SELECT hop, COUNT(DISTINCT "visitId")::int AS n
      FROM "PageEvent" WHERE type = 'hop' AND "createdAt" >= ${since}
      GROUP BY hop`,
    prisma.$queryRaw<{ device: string | null; n: number }[]>`
      SELECT device, COUNT(DISTINCT "visitId")::int AS n
      FROM "PageEvent" WHERE type = 'view' AND "createdAt" >= ${since}
      GROUP BY device ORDER BY n DESC`,
    prisma.$queryRaw<{ referrer: string; n: number }[]>`
      SELECT referrer, COUNT(DISTINCT "visitId")::int AS n
      FROM "PageEvent" WHERE type = 'view' AND referrer IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY referrer ORDER BY n DESC LIMIT 6`,
    prisma.$queryRaw<{ model: string | null; current: boolean; inp: number; out: number }[]>`
      SELECT model, ("createdAt" >= ${since}) AS current,
        COALESCE(SUM("inputTokens"), 0)::int AS inp, COALESCE(SUM("outputTokens"), 0)::int AS out
      FROM "ChatMessage" WHERE role = 'assistant' AND "createdAt" >= ${prevSince}
      GROUP BY 1, 2`,
    prisma.chatSession.count({ where: { createdAt: { gte: since } } }),
    prisma.chatSession.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.chatSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        createdAt: true,
        _count: { select: { messages: true } },
        messages: { where: { role: "user" }, orderBy: { createdAt: "asc" }, take: 1, select: { content: true } },
      },
    }),
  ]);

  // deret harian lengkap (hari kosong = 0) buat periode sekarang & sebelumnya
  const series = (rows: { day: Date; n: number }[]) => {
    const m = new Map(rows.map((r) => [dayKey(r.day), r.n]));
    const at = (i: number) => m.get(dayKey(new Date(now - i * DAY))) ?? 0;
    const current = Array.from({ length: days }, (_, k) => {
      const i = days - 1 - k;
      return { date: new Date(now - i * DAY), value: at(i) };
    });
    const previous = Array.from({ length: days }, (_, k) => at(2 * days - 1 - k));
    return { current, previous };
  };
  const visits = series(visitDaily);
  const answers = series(answerDaily);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  const cost = (current: boolean) =>
    tokens
      .filter((t) => t.current === current)
      .reduce((n, t) => {
        const p = priceFor(t.model);
        return n + (t.inp * p.input + t.out * p.output) / 1_000_000;
      }, 0);

  const totalVisits = sum(visits.current.map((d) => d.value));
  const hopMap = new Map(hops.map((h) => [h.hop, h.n]));
  const top = Math.max(1, totalVisits, ...hops.map((h) => h.n));
  const label = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return {
    days,
    visits: {
      current: totalVisits,
      previous: sum(visits.previous),
      daily: visits.current.map((d) => ({ label: label(d.date), value: d.value })),
    },
    answers: {
      current: sum(answers.current.map((d) => d.value)),
      previous: sum(answers.previous),
      trend: answers.current.map((d) => d.value),
    },
    sessions: { current: sessionsNow, previous: sessionsPrev },
    cost: { current: cost(true), previous: cost(false) },
    tokens: tokens.filter((t) => t.current).reduce((n, t) => ({ inp: n.inp + t.inp, out: n.out + t.out }), { inp: 0, out: 0 }),
    funnel: HOP_ORDER.map((h) => {
      const n = hopMap.get(h) ?? 0;
      return { label: HOP_LABEL[h]!, value: n, note: `${Math.round((n / top) * 100)}%` };
    }),
    devices: devices.map((d) => ({ label: d.device ?? "unknown", value: d.n })),
    referrers: referrers.map((r) => ({ label: r.referrer, value: r.n })),
    recent: recent.map((s) => ({
      id: s.id,
      at: s.createdAt,
      messages: s._count.messages,
      first: s.messages[0]?.content ?? "",
    })),
  };
}

/** Daftar percakapan (halaman Conversations), terbaru dulu, 25 per halaman. */
export async function listConversations(page: number, q: string) {
  const prisma = db();
  const take = 25;
  const where = q ? { messages: { some: { content: { contains: q, mode: "insensitive" as const } } } } : {};
  const [total, rows] = await Promise.all([
    prisma.chatSession.count({ where }),
    prisma.chatSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        createdAt: true,
        ipHash: true,
        _count: { select: { messages: true } },
        messages: { where: { role: "user" }, orderBy: { createdAt: "asc" }, take: 1, select: { content: true } },
      },
    }),
  ]);
  return {
    total,
    pages: Math.max(1, Math.ceil(total / take)),
    rows: rows.map((r) => ({
      id: r.id,
      at: r.createdAt,
      visitor: r.ipHash.slice(0, 6),
      messages: r._count.messages,
      first: r.messages[0]?.content ?? "",
    })),
  };
}
