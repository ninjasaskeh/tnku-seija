import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Satu PrismaClient buat seluruh server (Prisma 7 + driver adapter pg).
 * Di dev, hot reload bikin modul dievaluasi ulang; instance disimpen di globalThis
 * biar nggak bikin koneksi baru tiap save. Kalau DATABASE_URL di .env diganti selagi
 * dev server jalan, klien lama ditutup dan dibikin ulang ke database yang baru.
 */
const globalForDb = globalThis as unknown as { prisma?: PrismaClient; prismaUrl?: string };

export function db(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi (lihat .env.example)");
  if (!globalForDb.prisma || globalForDb.prismaUrl !== url) {
    globalForDb.prisma?.$disconnect().catch(() => {});
    globalForDb.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    globalForDb.prismaUrl = url;
  }
  return globalForDb.prisma;
}
