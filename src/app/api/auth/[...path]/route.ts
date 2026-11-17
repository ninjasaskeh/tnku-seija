import { auth, authConfigured } from "@/lib/auth";

/**
 * Proxy API Neon Auth (/api/auth/*): login Google, callback OAuth, sesi, sign out.
 * Handler dibikin pas request pertama, biar build nggak gagal kalau env auth belum diisi.
 */
type Handler = (req: Request, ctx: { params: Promise<{ path: string[] }> }) => Promise<Response>;
const route =
  (method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"): Handler =>
  (req, ctx) =>
    authConfigured().ready
      ? (auth().handler()[method] as unknown as Handler)(req, ctx)
      : Promise.resolve(Response.json({ error: "Auth is not configured on this server." }, { status: 503 }));

export const GET = route("GET");
export const POST = route("POST");
export const PUT = route("PUT");
export const PATCH = route("PATCH");
export const DELETE = route("DELETE");
