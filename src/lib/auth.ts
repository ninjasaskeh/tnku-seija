import "server-only";
import { createNeonAuth } from "@neon/auth/next/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";

/**
 * Login admin pake Neon Auth (Better Auth yang di-host Neon), lewat Google.
 * Data user & sesi disimpen Neon di skema `neon_auth` database kamu.
 *
 * PENTING: Neon Auth nggak punya setelan "tutup pendaftaran", jadi siapa pun bisa bikin akun.
 * Yang boleh masuk /admin cuma email di ADMIN_EMAILS (dan emailnya udah terverifikasi).
 * Tiap Server Action admin WAJIB manggil requireAdmin() sendiri: action itu endpoint POST publik.
 */
let instance: ReturnType<typeof createNeonAuth> | null = null;

export function auth() {
  if (!instance) {
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    const secret = process.env.NEON_AUTH_COOKIE_SECRET;
    if (!baseUrl || !secret || secret.length < 32)
      throw new Error("NEON_AUTH_BASE_URL / NEON_AUTH_COOKIE_SECRET (32+ karakter) belum diisi (lihat .env.example)");
    instance = createNeonAuth({ baseUrl, cookies: { secret, sameSite: "lax" } });
  }
  return instance;
}

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export type Viewer = { email: string; name: string; image: string | null; isAdmin: boolean } | null;

/** Siapa yang lagi login (atau null), plus boleh masuk admin atau nggak. */
export async function getViewer(): Promise<Viewer> {
  await connection(); // sesi dicek per request, bukan waktu prerender
  if (!authConfigured().ready) return null;
  const { data } = await auth().getSession();
  const user = data?.user;
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  return {
    email,
    name: user.name || email,
    image: user.image ?? null,
    isAdmin: Boolean(user.emailVerified) && adminEmails().includes(email),
  };
}

/** Buat halaman & action admin: lempar ke /admin/login kalau belum login / bukan admin. */
export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) redirect("/admin/login");
  return viewer;
}

/** Status konfigurasi, buat ngasih tau di halaman login kalau env belum lengkap. */
export function authConfigured() {
  const missing: string[] = [];
  if (!process.env.NEON_AUTH_BASE_URL) missing.push("NEON_AUTH_BASE_URL");
  if ((process.env.NEON_AUTH_COOKIE_SECRET ?? "").length < 32) missing.push("NEON_AUTH_COOKIE_SECRET (32+ chars)");
  if (!adminEmails().length) missing.push("ADMIN_EMAILS");
  return { ready: missing.length === 0, missing };
}
