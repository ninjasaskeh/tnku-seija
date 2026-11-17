import "server-only";
import { createHash } from "node:crypto";

/**
 * IP pengunjung → hash. IP asli nggak pernah disimpan.
 * Di belakang proxy/CDN (Vercel, Cloudflare) IP asli ada di x-forwarded-for (entri pertama).
 */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

let warned = false;

export function hashIp(ip: string): string {
  let salt = process.env.IP_SALT;
  if (!salt) {
    if (!warned) console.warn("[privacy] IP_SALT belum diisi; hash IP pake garam bawaan (isi di .env)");
    warned = true;
    salt = "portfolio-default-salt";
  }
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Baca angka dari env dengan default. */
export function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const json = (data: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(data, { status, headers });
