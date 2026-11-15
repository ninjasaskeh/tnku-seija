import gsap from "gsap";

/**
 * "Panggung" = scene 3D layar penuh + warna halaman.
 * Tiap bab (chapter) nentuin: bentuk kubus, warna latar, warna dither, posisi objek.
 * Mau ganti bentuk/warna per bab? Edit CHAPTERS di bawah.
 */
export type ChapterId = "hero" | "about" | "projects" | "skills" | "contact";

type Rgb = { r: number; g: number; b: number };
type Pose = { x: number; y: number; s: number };

const hex = (h: string): Rgb => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255,
});
const css = (c: Rgb) => `rgb(${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)})`;

export const CHAPTERS: Record<
  ChapterId,
  { label: string; shape: string; dark: string; light: string; fg: string; pose: Pose }
> = {
  // pose: x/y = geser objek (pecahan lebar/tinggi layar), s = skala
  hero: { label: "Stack", shape: "stack", dark: "#000000", light: "#c6ff00", fg: "#ffffff", pose: { x: 0.1, y: -0.02, s: 0.74 } },
  about: { label: "About", shape: "face", dark: "#000000", light: "#ffffff", fg: "#ffffff", pose: { x: -0.25, y: -0.04, s: 0.78 } },
  projects: { label: "Projects", shape: "num", dark: "#000000", light: "#c6ff00", fg: "#ffffff", pose: { x: 0.27, y: 0.2, s: 0.55 } },
  skills: { label: "Skills", shape: "code", dark: "#3b2bff", light: "#ffffff", fg: "#ffffff", pose: { x: 0.18, y: 0, s: 0.85 } },
  contact: { label: "Contact", shape: "at", dark: "#c6ff00", light: "#000000", fg: "#000000", pose: { x: 0.25, y: 0.08, s: 0.72 } },
};

export const CHAPTER_ORDER: ChapterId[] = ["hero", "about", "projects", "skills", "contact"];

export const stage = {
  chapter: null as ChapterId | null,
  /** id bentuk yang lagi dituju kubus: cube | stack | face | code | at | num0..numN */
  shape: "cube",
  project: 0,
  dark: hex("#000000"),
  light: hex("#c6ff00"),
  pose: { x: 0, y: 0, s: 0.8 } as Pose,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribeStage(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function applyVars() {
  const root = document.documentElement.style;
  root.setProperty("--stage-dark", css(stage.dark));
  root.setProperty("--stage-light", css(stage.light));
}

export function setChapter(id: ChapterId, instant = false) {
  if (stage.chapter === id) return;
  const def = CHAPTERS[id];
  stage.chapter = id;
  stage.shape = def.shape === "num" ? `num${stage.project}` : def.shape;
  document.documentElement.style.setProperty("--stage-fg", def.fg);

  // warna ganti patah-patah (steps), bukan fade halus
  const color = { duration: instant ? 0 : 0.45, ease: "steps(4)", overwrite: true, onUpdate: applyVars };
  gsap.to(stage.dark, { ...hex(def.dark), ...color });
  gsap.to(stage.light, { ...hex(def.light), ...color });
  gsap.to(stage.pose, { ...def.pose, duration: instant ? 0 : 1.2, ease: "power3.inOut", overwrite: true });
  emit();
}

export function setProject(index: number) {
  stage.project = index;
  if (stage.chapter === "projects") stage.shape = `num${index}`;
  emit();
}
