import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { defaultContent } from "@/data";
import { type Content, EXPERIENCE_KINDS, type ExperienceKind, type Fact, type Social } from "./content-types";
import { db } from "./db";

/** Tag cache konten. Admin manggil updateTag(CONTENT_TAG) tiap nyimpen perubahan. */
export const CONTENT_TAG = "content";

const asList = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asKind = (v: string): ExperienceKind =>
  (EXPERIENCE_KINDS as readonly string[]).includes(v) ? (v as ExperienceKind) : "full-time";

/**
 * Konten halaman dari database, di-cache (masuk static shell, nggak query DB tiap request).
 * Kalau database belum diisi / nggak bisa diakses → pake konten bawaan dari src/data,
 * jadi halaman tetep jalan (misal build tanpa DATABASE_URL).
 */
export async function getContent(): Promise<Content> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("days");

  try {
    const prisma = db();
    const [profile, groups, projects, jobs] = await Promise.all([
      prisma.profile.findUnique({ where: { id: 1 } }),
      prisma.skillGroup.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
      prisma.project.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { id: "asc" }] }),
      // tabel Experience bisa belum ada (migration belum dijalanin) → hop Logs kosong aja, sisanya tetep dari DB
      prisma.experience.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }).catch((err: Error) => {
        console.warn("[content] tabel Experience nggak bisa dibaca:", err.message);
        return [];
      }),
    ]);
    if (!profile) return defaultContent;

    return {
      profile: {
        name: profile.name,
        domain: profile.domain,
        role: profile.role,
        location: profile.location,
        tagline: profile.tagline,
        bio: profile.bio,
        story: profile.story ?? [],
        facts: asList<Fact>(profile.facts),
        socials: asList<Social>(profile.socials),
        email: profile.email,
        timezone: profile.timezone,
        timezoneLabel: profile.timezoneLabel,
      },
      skills: groups.map((g) => ({ group: g.name, items: g.items })),
      projects: projects.map((p) => ({
        slug: p.slug,
        title: p.title,
        year: p.year,
        role: p.role,
        description: p.description,
        stack: p.stack,
        links: { live: p.liveUrl ?? undefined, repo: p.repoUrl ?? undefined },
        thumbnail: p.thumbnail ?? undefined,
      })),
      experience: jobs.map((e) => ({
        company: e.company,
        role: e.role,
        kind: asKind(e.kind),
        location: e.location,
        start: e.start,
        end: e.end ?? undefined,
        summary: e.summary,
        highlights: e.highlights,
        stack: e.stack,
        url: e.url ?? undefined,
      })),
    };
  } catch (err) {
    console.warn("[content] database nggak bisa dibaca, pake konten bawaan:", (err as Error).message);
    return defaultContent;
  }
}
