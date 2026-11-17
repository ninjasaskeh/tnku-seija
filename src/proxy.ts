import { type NextRequest, NextResponse } from "next/server";
import { auth, authConfigured } from "@/lib/auth";

/**
 * Proxy (Next 16, pengganti middleware) khusus area /admin.
 *
 * Wajib ada buat Neon Auth: setelah login Google, Neon balikin ke
 * /admin?neon_auth_session_verifier=…, dan cuma middleware Neon yang nukerin token itu
 * jadi cookie sesi. Tanpa ini sesi nggak pernah kebentuk → mental balik ke /admin/login.
 * Sekalian nge-refresh sesi & lempar yang belum login ke /admin/login.
 *
 * Ini cuma lapisan pertama. Cek admin yang sebenernya (ADMIN_EMAILS) tetep di requireAdmin().
 */
let handler: ((req: NextRequest) => Promise<Response>) | null = null;

export default async function proxy(request: NextRequest) {
  if (!authConfigured().ready) return NextResponse.next();
  // Server Action ngecek auth-nya sendiri (requireAdmin); jangan di-redirect di tengah POST
  if (request.headers.has("next-action")) return NextResponse.next();
  handler ??= auth().middleware({ loginUrl: "/admin/login" }) as (req: NextRequest) => Promise<Response>;
  return handler(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
