/**
 * Calm mode: pengunjung bisa matiin efek yang "rame" (jalur PCB, aliran paket 3D,
 * glitch, ping klik) tanpa harus nyalain reduced motion di OS-nya.
 * Disimpen per browser (localStorage) dan dipasang sebagai class `html.calm`.
 * Pola sama kayak stage.ts: objek mutable + subscribe.
 */
const KEY = "portfolio:calm";

function saved() {
  try {
    return typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Langsung dibaca dari localStorage pas modul dimuat di browser (sebelum komponen mana pun animasi). */
export const calm = { on: saved() };

const listeners = new Set<() => void>();

export function subscribeCalm(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setCalm(on: boolean) {
  calm.on = on;
  document.documentElement.classList.toggle("calm", on);
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

/** Pasang class `html.calm` sesuai pilihan tersimpan (dipanggil sekali pas mount). */
export function initCalm() {
  setCalm(saved());
}
