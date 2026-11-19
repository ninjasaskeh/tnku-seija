"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";
import { CONTENT_TAG } from "@/lib/content";
import { db } from "@/lib/db";
import { deleteImage, uploadImage } from "@/lib/storage";
import { FLASH_COOKIE } from "@/lib/flash";
import { EXPERIENCE_KINDS } from "@/lib/content-types";

/**
 * Server Actions admin. SEMUA mulai dengan requireAdmin() (login sendiri lewat Better Auth / Google),
 * dan semua input dari form divalidasi di sini (form di browser bisa dimanipulasi).
 */
/** ok/error tampil sebagai toast di ActionForm. */
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

/**
 * Link aman: http(s), mailto, path relatif, atau "#". Nolak javascript: dkk.
 * Domain tanpa protokol (mis. "www.linkedin.com/in/nama") otomatis jadi "https://...".
 */
function safeUrl(v: string): string | null {
  if (!v) return null;
  if (v === "#" || (v.startsWith("/") && !v.startsWith("//"))) return v; // "//host" = link luar, bukan path
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]\S*)?$/i.test(v)) v = `https://${v}`;
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

/**
 * Pesan toast buat action yang redirect (hasil action-nya nggak pernah sampai ke form).
 * Disimpan di cookie pendek, dibaca & dihapus FlashToast (src/components/admin/Toaster.tsx) di halaman tujuan.
 */
async function flash(message: string) {
  (await cookies()).set(FLASH_COOKIE, message, { path: "/admin", maxAge: 30, sameSite: "lax" });
}

// ---------- sesi ----------

export async function logout() {
  // nextCookies() di config auth yang ngehapus cookie sesi dari dalam Server Action
  await auth.api.signOut({ headers: await headers() }).catch(() => null);
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
    socials: pairs(str(form, "socials", 2000)).map(([label, href]) => ({ label, href: safeUrl(href) ?? "", raw: href })),
    email: str(form, "email", 120),
    timezone: str(form, "timezone", 60),
    timezoneLabel: str(form, "timezoneLabel", 10),
  };
  if (!data.name || !data.role || !data.domain) return { error: "Name, role and domain are required." };
  const badLink = data.socials.find((s) => !s.href);
  if (badLink) return { error: `Link "${badLink.label}" is not a valid URL: ${badLink.raw}` };
  const socials = data.socials.map(({ label, href }) => ({ label, href }));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: "Email looks invalid." };
  try {
    new Intl.DateTimeFormat("en", { timeZone: data.timezone });
  } catch {
    return { error: `Unknown timezone "${data.timezone}" (use e.g. Asia/Jakarta).` };
  }

  const row = { ...data, socials };
  await db().profile.upsert({ where: { id: 1 }, create: { id: 1, ...row }, update: row });
  updateTag(CONTENT_TAG);
  return { ok: "Profile saved." };
}

/** Cerita Keep-Alive: tiap input "beat" = satu paragraf (urutan form = urutan di situs). */
export async function saveStory(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const beats = form
    .getAll("beat")
    .map((v) => String(v).replace(/\s+/g, " ").trim().slice(0, 600))
    .filter(Boolean)
    .slice(0, 8);
  const updated = await db()
    .profile.update({ where: { id: 1 }, data: { story: beats } })
    .catch(() => null);
  if (!updated) return { error: "Save your profile first (Profile page), then add the story." };
  updateTag(CONTENT_TAG);
  return { ok: beats.length ? `Saved ${beats.length} beat${beats.length > 1 ? "s" : ""}.` : "Story cleared." };
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

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_JOBS = 12;

/**
 * Riwayat kerja (hop Logs). Tiap kartu di ExperienceEditor ngirim input dengan nama yang sama
 * (company, role, kind, ...), jadi getAll(nama)[i] = kartu ke-i. Urutan kartu = urutan di situs.
 * Semua baris diganti sekaligus, kayak saveSkills.
 */
export async function saveExperience(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const col = (k: string, max: number) => form.getAll(k).map((v) => String(v).trim().slice(0, max));
  const company = col("company", 80);
  const role = col("role", 80);
  const kind = col("kind", 20);
  const location = col("location", 80);
  const start = col("start", 7);
  const end = col("end", 7);
  const summary = col("summary", 600);
  const highlights = col("highlights", 2000);
  const stack = col("stack", 400);
  const url = col("url", 300);

  const jobs = [];
  for (let i = 0; i < company.length; i++) {
    const n = i + 1;
    const blank = !company[i] && !role[i] && !start[i] && !summary[i] && !highlights[i];
    if (blank) continue; // kartu kosong dilewatin
    if (!company[i] || !role[i]) return { error: `Entry ${n}: company and role are required.` };
    if (!MONTH_RE.test(start[i] ?? "")) return { error: `Entry ${n}: start must look like 2024-03.` };
    const e = end[i] || null;
    if (e && !MONTH_RE.test(e)) return { error: `Entry ${n}: end must look like 2025-01, or stay empty if you still work there.` };
    if (e && e < start[i]!) return { error: `Entry ${n}: end is before start.` };
    const link = url[i] ? safeUrl(url[i]!) : null;
    if (url[i] && !link) return { error: `Entry ${n}: link is not a valid URL: ${url[i]}` };
    jobs.push({
      company: company[i]!,
      role: role[i]!,
      kind: (EXPERIENCE_KINDS as readonly string[]).includes(kind[i] ?? "") ? kind[i]! : "full-time",
      location: location[i] ?? "",
      start: start[i]!,
      end: e,
      summary: summary[i] ?? "",
      highlights: lines(highlights[i] ?? "").map((h) => h.replace(/^[-*•]\s*/, "").slice(0, 300)).slice(0, 8),
      stack: list(stack[i] ?? "").map((x) => x.slice(0, 40)).slice(0, 12),
      url: link,
    });
  }
  if (jobs.length > MAX_JOBS) return { error: `Keep it to ${MAX_JOBS} entries or fewer.` };

  const prisma = db();
  try {
    await prisma.$transaction([
      prisma.experience.deleteMany(),
      prisma.experience.createMany({ data: jobs.map((j, i) => ({ ...j, order: i })) }),
    ]);
  } catch (e) {
    console.error("[saveExperience]", (e as Error).message);
    return { error: "Could not save. Did you run the database migration (npm run db:deploy)?" };
  }
  updateTag(CONTENT_TAG);
  return { ok: jobs.length ? `Saved ${jobs.length} entr${jobs.length > 1 ? "ies" : "y"}.` : "Experience cleared." };
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
  if (createdId) {
    await flash("Project created.");
    redirect(`/admin/projects/${createdId}`);
  }
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
  await flash(gone ? `Deleted "${gone.title}".` : "Project was already gone.");
  redirect("/admin/projects");
}

export async function deleteChatSession(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (!id) return { error: "Missing session." };
  if (form.get("confirm") !== "on") return { error: "Tick the confirm box to delete." };
  await db().chatSession.delete({ where: { id } }).catch(() => null);
  await flash("Conversation deleted.");
  redirect("/admin/conversations");
}

// ---------- easter egg AI ----------

const KINDS = ["public", "friend", "other"];

export async function saveReference(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const names = list(str(form, "names", 300)).map((n) => n.slice(0, 60)).slice(0, 10);
  const note = str(form, "note", 500);
  const kind = KINDS.includes(str(form, "kind", 10)) ? str(form, "kind", 10) : "other";
  if (!names.length) return { error: "Add at least one name (comma separated for nicknames)." };
  if (!note) return { error: "Write a note so the AI knows what to say." };
  const data = { names, note, kind, enabled: form.get("enabled") === "on" };
  if (id) await db().reference.update({ where: { id }, data });
  else await db().reference.create({ data });
  updateTag(CONTENT_TAG);
  return { ok: id ? "Saved." : `Added ${names[0]}.` };
}

export async function deleteReference(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!id) return { error: "Missing entry." };
  if (form.get("confirm") !== "on") return { error: "Tick the confirm box to delete." };
  await db().reference.delete({ where: { id } }).catch(() => null);
  updateTag(CONTENT_TAG);
  return { ok: "Deleted." };
}
