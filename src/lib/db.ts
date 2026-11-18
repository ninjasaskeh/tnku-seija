import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Satu PrismaClient buat seluruh server (Prisma 7 + driver adapter pg).
 * Di dev, hot reload bikin modul dievaluasi ulang; instance disimpen di globalThis
 * biar nggak bikin koneksi baru tiap save. Klien lama ditutup & dibikin ulang kalau:
 * - DATABASE_URL di .env diganti selagi dev server jalan, atau
 * - client Prisma di-generate ulang (abis migrasi): instance lama nggak kenal kolom baru
 *   dan bakal balikin `undefined` buat field itu.
 */
const globalForDb = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
  prismaClass?: typeof PrismaClient;
};

export function db(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi (lihat .env.example)");
  if (!globalForDb.prisma || globalForDb.prismaUrl !== url || globalForDb.prismaClass !== PrismaClient) {
    globalForDb.prisma?.$disconnect().catch(() => {});
    globalForDb.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    globalForDb.prismaUrl = url;
    globalForDb.prismaClass = PrismaClient;
  }
  return globalForDb.prisma;
}
