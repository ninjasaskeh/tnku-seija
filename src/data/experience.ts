import type { Experience } from "@/lib/content-types";

/**
 * DATA PENGALAMAN KERJA DEFAULT — konten aslinya di database (edit lewat /admin/experience).
 * Dipake buat isi awal database, cadangan kalau DB mati, dan build preview.
 * Urutan = urutan baris di access.log (terbaru dulu). end kosong = masih kerja di sana.
 */
export const experience: Experience[] = [
  {
    company: "PT Program Nusantara Solusindo",
    role: "Full-Stack Developer",
    kind: "full-time",
    location: "Cikarang, West Java",
    start: "2025-01",
    summary:
      "IT consulting company building custom ERP web applications for bonded zone manufacturers in the Cikarang industrial area.",
    highlights: [
      "Built 50+ single-page application (SPA) pages with React, TypeScript, and Inertia.js, connected directly to Laravel controllers without a separate API layer.",
      "Developed and maintained ERP systems for 5+ manufacturing clients in bonded zones (Kawasan Berikat and Gudang Berikat).",
      "Designed and implemented 4 core ERP modules (inventory, purchasing, sales, production), turning complex factory workflows into user-friendly React interfaces.",
      "Developed inventory tracking and customs compliance reports for bonded zones, processing 10,000+ stock movements per month.",
      "Reduced report loading time by 40% on large transactional datasets by optimizing PostgreSQL queries with database indexing.",
    ],
    stack: ["React", "TypeScript", "Inertia.js", "Laravel", "PostgreSQL"],
  },
];
