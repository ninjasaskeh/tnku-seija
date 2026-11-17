import type { Project } from "@/lib/content-types";

export type { Project };

/**
 * DATA PROJECT DEFAULT — konten aslinya sekarang di database (edit lewat /admin).
 * Dipake buat isi awal database, cadangan kalau DB mati, dan build preview.
 * Nomor (01, 02, ...) diambil dari urutan, dan kubus 3D ikut nyusun angka itu.
 *
 * thumbnail: taruh gambar di /public/projects/ lalu isi path-nya,
 * misal "/projects/alpha.jpg". Kalau dikosongin, dipake gambar generatif.
 */

export const projects: Project[] = [
  {
    slug: "project-alpha",
    title: "Project Alpha",
    year: "2026",
    role: "Fullstack",
    description:
      "Placeholder. Write one or two sentences: what the problem was, which part you built, and how it turned out.",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    links: { live: "#", repo: "#" },
  },
  {
    slug: "project-beta",
    title: "Project Beta",
    year: "2025",
    role: "Backend + API",
    description:
      "Placeholder. Example: a REST API for app X with authentication and a payment integration.",
    stack: ["Node.js", "Express", "Redis"],
    links: { repo: "#" },
  },
  {
    slug: "project-gamma",
    title: "Project Gamma",
    year: "2025",
    role: "Fullstack",
    description:
      "Placeholder. Example: an internal dashboard with realtime data and role-based access.",
    stack: ["React", "Prisma", "Docker"],
    links: { live: "#" },
  },
  {
    slug: "project-delta",
    title: "Project Delta",
    year: "2024",
    role: "Frontend",
    description:
      "Placeholder. Example: a landing page and design system for product Y, tuned for performance.",
    stack: ["Next.js", "Tailwind CSS"],
    links: { live: "#", repo: "#" },
  },
];
