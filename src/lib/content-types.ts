/**
 * Bentuk konten portfolio. Dipake di server (dibaca dari DB) dan di client (lewat ContentProvider).
 * File ini sengaja polos (tanpa import server) biar aman diimport dari mana aja, termasuk build preview.
 */
export type Fact = { label: string; value: string };
export type Social = { label: string; href: string };

export type Profile = {
  name: string;
  /** domain kamu, dipake di URL bar, boot screen, terminal */
  domain: string;
  role: string;
  location: string;
  tagline: string;
  bio: string[];
  /** cerita perjalanan buat hop Keep-Alive (paragraf urut) */
  story: string[];
  facts: Fact[];
  /** zona waktu buat jam di section Contact */
  timezone: string;
  timezoneLabel: string;
  email: string;
  socials: Social[];
};

/** Grup skill = "tabel" di bab Query. Nama grup jadi filter WHERE di sana. */
export type SkillGroup = { group: string; items: string[] };

export type Project = {
  slug: string;
  title: string;
  year: string;
  role: string;
  description: string;
  stack: string[];
  links: { live?: string; repo?: string };
  /** path gambar di /public/projects/, kosong = gambar generatif */
  thumbnail?: string;
};

/** Jenis kerjaan. Di hop Logs tiap jenis jadi "method" HTTP (lihat Experience.tsx). */
export const EXPERIENCE_KINDS = ["full-time", "part-time", "contract", "freelance", "internship"] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];

/** Satu kerjaan = satu baris di access.log (hop Logs). */
export type Experience = {
  company: string;
  role: string;
  kind: ExperienceKind;
  location: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM", kosong = masih di sini */
  end?: string;
  summary: string;
  highlights: string[];
  stack: string[];
  url?: string;
};

export type Content = {
  profile: Profile;
  skills: SkillGroup[];
  projects: Project[];
  experience: Experience[];
};
