import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy (Next 16, pengganti middleware) khusus /admin.
 *
 * Kerangka admin itu statis (partial prerender), sementara cek login jalan di bagian yang
 * di-stream. Tanpa proxy ini, orang yang belum login sempet liat sidebar + skeleton dulu
 * sebelum di-redirect. Di sini: nggak ada cookie sesi Better Auth → langsung redirect ke
 * /admin/login sebelum apa pun dirender.
 *
 * Ini cuma cek cepat "cookie-nya ada" (sesuai docs Better Auth: optimistic, bukan pengaman).
 * Cek sebenarnya (sesi valid + email di ADMIN_EMAILS) tetep di requireAdmin() tiap halaman & action.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return NextResponse.next();
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
