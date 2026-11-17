import "server-only";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

/**
 * Konfigurasi Better Auth (sesuai docs: file auth.ts di lib/, export bernama `auth`).
 * - Data user/sesi di Postgres lewat Prisma (model User/Session/Account/Verification).
 * - Login cuma lewat Google. Email/password nggak dinyalain.
 * - Cuma email di ADMIN_EMAILS yang boleh bikin akun → pendaftaran orang lain ditolak di sini,
 *   bukan cuma disembunyiin di UI.
 *
 * Env: BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAILS.
 */
export const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(db(), { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
    },
  },
  databaseHooks: {
    user: {
      create: {
        // akun baru cuma boleh buat email admin
        before: async (user) => {
          if (!adminEmails().includes(user.email.toLowerCase())) {
            // `code` → Better Auth redirect ke errorCallbackURL?error=not_admin (lihat halaman login)
            throw new APIError("FORBIDDEN", { code: "not_admin", message: "This Google account is not allowed here." });
          }
          return { data: user };
        },
      },
    },
  },
  // harus paling akhir: biar Server Action (mis. sign out) bisa nyetel cookie
  plugins: [nextCookies()],
});
