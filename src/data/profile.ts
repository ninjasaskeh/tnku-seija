/**
 * DATA PROFIL — nama, bio, skill, kontak. Semua masih placeholder, ganti di sini.
 * Teks di web pake bahasa Inggris.
 */
export const profile = {
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
export const skills = [
  { group: "Frontend", items: ["TypeScript", "React", "Next.js", "Tailwind CSS"] },
  { group: "Backend", items: ["Node.js", "REST API", "Auth", "WebSocket"] },
  { group: "Database", items: ["PostgreSQL", "MySQL", "Redis", "Prisma"] },
  { group: "Tools", items: ["Git", "Docker", "CI/CD", "Linux"] },
];

export const nav = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];
