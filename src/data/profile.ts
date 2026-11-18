import type { Profile, SkillGroup } from "@/lib/content-types";

/**
 * DATA PROFIL DEFAULT — sekarang konten aslinya ada di database (edit lewat /admin).
 * File ini dipake buat: isi awal database (npm run db:seed), cadangan kalau database
 * nggak bisa diakses, dan build preview satu-file. Teks di web pake bahasa Inggris.
 */
export const profile: Profile = {
  name: "Your Name",
  /** Domain kamu — dipake di URL bar, boot screen (DNS lookup), dan header response */
  domain: "yourname.dev",
  role: "Fullstack Developer",
  location: "Indonesia",
  tagline: "I build web apps end to end: the schema, the API, and the interface people actually touch.",
  bio: [
    "Fullstack developer who takes a product from an empty repo to production: modelling the data, writing the API, and shipping an interface that feels fast.",
    "Placeholder. Replace this paragraph with your own story: your experience, the kind of projects you like, and how you work.",
  ],
  story: [
    "Placeholder. Where it started: the first thing you built, the moment code clicked for you.",
    "Placeholder. What came next: how you went from that to building full products, and what you learned the hard way.",
    "Placeholder. Why you keep going: the kind of problems that still get you excited to open the editor.",
  ],
  facts: [
    { label: "Role", value: "Fullstack Developer" },
    { label: "Based in", value: "Indonesia" },
    { label: "Focus", value: "Web apps, APIs, databases" },
    { label: "Status", value: "Open to new projects" },
  ],
  /** Zona waktu buat jam di section Contact */
  timezone: "Asia/Jakarta",
  timezoneLabel: "WIB",
  email: "hello@yourdomain.dev",
  socials: [
    { label: "GitHub", href: "https://github.com/username" },
    { label: "LinkedIn", href: "https://linkedin.com/in/username" },
  ],
};

/** Grup skill = "tabel" di bab Query. Filter WHERE di sana diambil dari nama grup. */
export const skills: SkillGroup[] = [
  { group: "Frontend", items: ["TypeScript", "React", "Next.js", "Tailwind CSS"] },
  { group: "Backend", items: ["Node.js", "REST API", "Auth", "WebSocket"] },
  { group: "Database", items: ["PostgreSQL", "MySQL", "Redis", "Prisma"] },
  { group: "Tools", items: ["Git", "Docker", "CI/CD", "Linux"] },
];

/** Menu = anchor ke tiap hop. Struktural, bukan konten, jadi nggak masuk database. */
export const nav = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Story", href: "#keepalive" },
  { label: "Contact", href: "#contact" },
];
