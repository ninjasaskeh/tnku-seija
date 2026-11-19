/**
 * Isi awal database dari konten bawaan di src/data. Jalanin: npm run db:seed
 * Aman diulang: profile di-upsert, skill, project & experience cuma diisi kalau tabelnya masih kosong
 * (biar editan dari /admin nggak ketimpa).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { profile, skills } from "../src/data/profile";
import { projects } from "../src/data/projects";
import { experience } from "../src/data/experience";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const p = {
    name: profile.name,
    domain: profile.domain,
    role: profile.role,
    location: profile.location,
    tagline: profile.tagline,
    bio: profile.bio,
    story: profile.story,
    facts: profile.facts,
    socials: profile.socials,
    email: profile.email,
    timezone: profile.timezone,
    timezoneLabel: profile.timezoneLabel,
  };
  await prisma.profile.upsert({ where: { id: 1 }, create: { id: 1, ...p }, update: {} });

  if ((await prisma.skillGroup.count()) === 0) {
    await prisma.skillGroup.createMany({
      data: skills.map((s, i) => ({ name: s.group, items: s.items, order: i })),
    });
  }

  if ((await prisma.project.count()) === 0) {
    await prisma.project.createMany({
      data: projects.map((pr, i) => ({
        slug: pr.slug,
        title: pr.title,
        year: pr.year,
        role: pr.role,
        description: pr.description,
        stack: pr.stack,
        liveUrl: pr.links.live ?? null,
        repoUrl: pr.links.repo ?? null,
        thumbnail: pr.thumbnail ?? null,
        order: i,
      })),
    });
  }
  if ((await prisma.experience.count()) === 0) {
    await prisma.experience.createMany({
      data: experience.map((e, i) => ({
        company: e.company,
        role: e.role,
        kind: e.kind,
        location: e.location,
        start: e.start,
        end: e.end ?? null,
        summary: e.summary,
        highlights: e.highlights,
        stack: e.stack,
        url: e.url ?? null,
        order: i,
      })),
    });
  }
  console.log("seed selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
