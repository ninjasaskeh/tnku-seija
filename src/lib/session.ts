import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { adminEmails, auth } from "./auth";

/**
 * Helper sesi admin di atas Better Auth (src/lib/auth.ts).
 * Tiap halaman & Server Action admin WAJIB manggil requireAdmin() sendiri:
 * action itu endpoint POST publik, nyembunyiin form bukan pengaman.
 */
export type Viewer = { email: string; name: string; image: string | null; isAdmin: boolean } | null;

/** Siapa yang lagi login (atau null), plus boleh masuk admin atau nggak. */
export async function getViewer(): Promise<Viewer> {
  await connection(); // sesi dicek per request, bukan waktu prerender
  if (!authConfigured().ready) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
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
  if ((process.env.BETTER_AUTH_SECRET ?? "").length < 32) missing.push("BETTER_AUTH_SECRET (32+ chars)");
  if (!process.env.BETTER_AUTH_URL) missing.push("BETTER_AUTH_URL");
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!adminEmails().length) missing.push("ADMIN_EMAILS");
  return { ready: missing.length === 0, missing };
}
