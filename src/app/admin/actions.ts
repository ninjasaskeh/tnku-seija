"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth, requireAdmin } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/content";
import { db } from "@/lib/db";
import { deleteImage, uploadImage } from "@/lib/storage";

/**
 * Server Actions admin. SEMUA mulai dengan requireAdmin() (login sendiri lewat Neon Auth / Google),
 * dan semua input dari form divalidasi di sini (form di browser bisa dimanipulasi).
 */
export type ActionState = { ok?: string; error?: string } | null;

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const lines = (v: string) =>
  v
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const list = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Link aman: http(s), mailto, path relatif, atau "#". Nolak javascript: dkk. */
function safeUrl(v: string): string | null {
  if (!v) return null;
  if (v === "#" || v.startsWith("/")) return v;
  try {
    const u = new URL(v);
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? v : null;
  } catch {
    return null;
  }
}

/** "Label | isi" per baris → [{a, b}] */
function pairs(v: string): [string, string][] {
  return lines(v)
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((p): p is [string, string] => p.length >= 2 && !!p[0] && !!p[1])
    .map(([a, ...b]) => [a, b.join("|").trim()]);
}

// ---------- sesi ----------

export async function logout() {
  await auth()
    .signOut()
    .catch(() => null);
  redirect("/admin/login");
}

// ---------- konten ----------

export async function saveProfile(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const data = {
    name: str(form, "name", 80),
    domain: str(form, "domain", 80),
    role: str(form, "role", 80),
    location: str(form, "location", 80),
    tagline: str(form, "tagline", 300),
    bio: str(form, "bio", 4000)
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean),
    facts: pairs(str(form, "facts", 2000)).map(([label, value]) => ({ label, value })),
    socials: pairs(str(form, "socials", 2000))
      .map(([label, href]) => ({ label, href: safeUrl(href) }))
      .filter((s): s is { label: string; href: string } => !!s.href),
    email: str(form, "email", 120),
    timezone: str(form, "timezone", 60),
    timezoneLabel: str(form, "timezoneLabel", 10),
  };
  if (!data.name || !data.role || !data.domain) return { error: "Name, role and domain are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: "Email looks invalid." };
  try {
    new Intl.DateTimeFormat("en", { timeZone: data.timezone });
  } catch {
    return { error: `Unknown timezone "${data.timezone}" (use e.g. Asia/Jakarta).` };
  }

  await db().profile.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  updateTag(CONTENT_TAG);
  return { ok: "Profile saved." };
}

/** Format: satu grup per baris, "Grup: item, item, item". Urutan baris = urutan di situs. */
export async function saveSkills(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const groups = lines(str(form, "skills", 4000))
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? { name: l.slice(0, i).trim(), items: list(l.slice(i + 1)) } : null;
    })
    .filter((g): g is { name: string; items: string[] } => !!g && !!g.name && g.items.length > 0);
  if (!groups.length) return { error: 'Use one line per group, like "Frontend: React, Next.js".' };

  const prisma = db();
  await prisma.$transaction([
    prisma.skillGroup.deleteMany(),
    prisma.skillGroup.createMany({ data: groups.map((g, i) => ({ ...g, order: i })) }),
  ]);
  updateTag(CONTENT_TAG);
  return { ok: `Saved ${groups.length} groups.` };
}

function projectData(form: FormData) {
  return {
    slug: str(form, "slug", 60).toLowerCase(),
    title: str(form, "title", 80),
    year: str(form, "year", 10),
    role: str(form, "role", 80),
    description: str(form, "description", 1000),
    stack: list(str(form, "stack", 400)),
    liveUrl: safeUrl(str(form, "liveUrl", 300)),
    repoUrl: safeUrl(str(form, "repoUrl", 300)),
    // path lokal (/projects/x.jpg) atau URL https (mis. hasil upload ke Neon Storage)
    thumbnail: (() => {
      const t = str(form, "thumbnail", 400);
      return t.startsWith("/") || t.startsWith("https://") ? t : null;
    })(),
    order: Number(str(form, "order", 5)) || 0,
    published: form.get("published") === "on",
  };
}

function checkProject(d: ReturnType<typeof projectData>): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) return "Slug: lowercase letters, numbers and dashes only.";
  if (!d.title || !d.description) return "Title and description are required.";
  return null;
}

export async function saveProject(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const d = projectData(form);
  const bad = checkProject(d);
  if (bad) return { error: bad };

  const prev = id ? await db().project.findUnique({ where: { id }, select: { thumbnail: true } }) : null;
  const file = form.get("thumbnailFile");
  if (file instanceof File && file.size > 0) {
    try {
      d.thumbnail = await uploadImage(file, `projects/${d.slug}`);
    } catch (e) {
      return { error: (e as Error).message || "Upload failed." };
    }
  } else if (form.get("removeThumbnail") === "on") {
    d.thumbnail = null;
  }
  let createdId: number | null = null;
  try {
    if (id) await db().project.update({ where: { id }, data: d });
    else createdId = (await db().project.create({ data: d, select: { id: true } })).id;
  } catch {
    if (d.thumbnail !== prev?.thumbnail) await deleteImage(d.thumbnail); // jangan ninggalin file yatim
    return { error: "Could not save. Is the slug already used by another project?" };
  }
  // gambar lama dibuang dari storage kalau udah diganti/dihapus
  if (prev?.thumbnail && prev.thumbnail !== d.thumbnail) await deleteImage(prev.thumbnail);
  updateTag(CONTENT_TAG);
  if (createdId) redirect(`/admin/projects/${createdId}`);
  return { ok: "Project saved." };
}

export async function deleteProject(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!id) return { error: "Missing project." };
  if (form.get("confirm") !== "on") return { error: "Tick the confirm box to delete." };
  const gone = await db().project.delete({ where: { id } }).catch(() => null);
  await deleteImage(gone?.thumbnail);
  updateTag(CONTENT_TAG);
  redirect("/admin/projects");
}

export async function deleteChatSession(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (!id) return { error: "Missing session." };
  if (form.get("confirm") !== "on") return { error: "Tick the confirm box to delete." };
  await db().chatSession.delete({ where: { id } }).catch(() => null);
  redirect("/admin/conversations");
}
