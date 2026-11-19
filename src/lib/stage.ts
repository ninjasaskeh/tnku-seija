import gsap from "gsap";

/**
 * KONSEP: ROUND TRIP — pengunjung = satu HTTP request yang nembus seluruh stack.
 * Tiap bab = satu "hop": request dikirim → handshake → router/API → logs (riwayat kerja) → database → keep-alive (cerita) → response.
 *
 * "Panggung" = scene 3D layar penuh + warna halaman.
 * Tiap bab nentuin: bentuk kubus, warna latar, warna dither, posisi objek, dan info hop (buat HUD).
 * Mau ganti bentuk/warna per bab? Edit CHAPTERS di bawah.
 */
export type ChapterId = "hero" | "about" | "projects" | "logs" | "skills" | "keepalive" | "contact";

type Rgb = { r: number; g: number; b: number };
type Pose = { x: number; y: number; s: number };

const hex = (h: string): Rgb => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255,
});
const css = (c: Rgb) => `rgb(${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)})`;

export type Chapter = {
  /** nama hop (HUD, header) */
  label: string;
  /** lapisan stack tempat hop ini terjadi */
  layer: string;
  /** alamat palsu node-nya (dekorasi traceroute) */
  addr: string;
  /** waktu kumulatif (ms) saat request sampai di hop ini — dekorasi waterfall */
  ms: number;
  shape: string;
  dark: string;
  light: string;
  fg: string;
  pose: Pose;
};

export const CHAPTERS: Record<ChapterId, Chapter> = {
  // pose: x/y = geser objek (pecahan lebar/tinggi layar), s = skala
  hero: { label: "Request", layer: "L0 / CLIENT", addr: "127.0.0.1", ms: 0, shape: "packet", dark: "#000000", light: "#c6ff00", fg: "#ffffff", pose: { x: 0.06, y: 0.0, s: 0.62 } },
  about: { label: "Handshake", layer: "L1 / TLS", addr: "10.0.0.1", ms: 38, shape: "lock", dark: "#000000", light: "#b18cff", fg: "#ffffff", pose: { x: -0.27, y: -0.02, s: 0.6 } },
  projects: { label: "Routes", layer: "L2 / API", addr: "10.0.2.4", ms: 112, shape: "route", dark: "#000000", light: "#c6ff00", fg: "#ffffff", pose: { x: 0.3, y: 0.22, s: 0.46 } },
  logs: { label: "Logs", layer: "L3 / LOGGING", addr: "10.0.3.1", ms: 240, shape: "log", dark: "#000000", light: "#ffffff", fg: "#ffffff", pose: { x: 0.3, y: 0.04, s: 0.56 } },
  skills: { label: "Query", layer: "L4 / DATABASE", addr: "10.0.4.9", ms: 486, shape: "db", dark: "#3b2bff", light: "#ffffff", fg: "#ffffff", pose: { x: 0.3, y: 0.02, s: 0.64 } },
  keepalive: { label: "Keep-Alive", layer: "L5 / CONNECTION", addr: "10.0.5.2", ms: 820, shape: "heart", dark: "#b18cff", light: "#000000", fg: "#000000", pose: { x: 0.28, y: 0.04, s: 0.56 } },
  contact: { label: "Response", layer: "200 / OK", addr: "127.0.0.1", ms: 1240, shape: "ok", dark: "#c6ff00", light: "#000000", fg: "#000000", pose: { x: 0.28, y: 0.1, s: 0.58 } },
};

export const CHAPTER_ORDER: ChapterId[] = ["hero", "about", "projects", "logs", "skills", "keepalive", "contact"];

export const stage = {
  chapter: null as ChapterId | null,
  /** id bentuk yang lagi dituju kubus: packet | lock | route0..N | log | db | heart | ok | cube */
  shape: "cube",
  project: 0,
  dark: hex("#000000"),
  light: hex("#c6ff00"),
  pose: { x: 0, y: 0, s: 0.8 } as Pose,
  /** 0..1 — "packet loss": dinaikin tiap pindah bab, meluruh sendiri di scene */
  glitch: 0,
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

const routeShape = () => `route${stage.project}`;

export function setChapter(id: ChapterId, instant = false) {
  if (stage.chapter === id) return;
  const def = CHAPTERS[id];
  stage.chapter = id;
  stage.shape = def.shape === "route" ? routeShape() : def.shape;
  if (!instant) stage.glitch = 0.8;
  document.documentElement.style.setProperty("--stage-fg", def.fg);
  document.documentElement.dataset.chapter = id;

  // warna ganti patah-patah (steps), bukan fade halus
  const color = { duration: instant ? 0 : 0.45, ease: "steps(4)", overwrite: true, onUpdate: applyVars };
  gsap.to(stage.dark, { ...hex(def.dark), ...color });
  gsap.to(stage.light, { ...hex(def.light), ...color });
  gsap.to(stage.pose, { ...def.pose, duration: instant ? 0 : 1.2, ease: "power3.inOut", overwrite: true });
  emit();
}

export function setProject(index: number) {
  stage.project = index;
  if (stage.chapter === "projects") {
    stage.shape = routeShape();
    stage.glitch = Math.max(stage.glitch, 0.6);
  }
  emit();
}
