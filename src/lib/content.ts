import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { defaultContent } from "@/data";
import type { Content, Fact, Social } from "./content-types";
import { db } from "./db";

/** Tag cache konten. Admin manggil updateTag(CONTENT_TAG) tiap nyimpen perubahan. */
export const CONTENT_TAG = "content";

const asList = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

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
    const [profile, groups, projects] = await Promise.all([
      prisma.profile.findUnique({ where: { id: 1 } }),
      prisma.skillGroup.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
      prisma.project.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { id: "asc" }] }),
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
    };
  } catch (err) {
    console.warn("[content] database nggak bisa dibaca, pake konten bawaan:", (err as Error).message);
    return defaultContent;
  }
}
