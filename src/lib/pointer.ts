/**
 * Satu sumber data mouse buat cursor, hero, dan scene 3D.
 * x/y: -1..1 dari tengah layar. speed: 0..1 (kecepatan, makin kenceng makin gede).
 */
export const pointer = { x: 0, y: 0, px: 0, py: 0, vx: 0, speed: 0, active: false };

let attached = false;
let lastT = 0;

export function attachPointer() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      const dx = e.clientX - pointer.px;
      const dy = e.clientY - pointer.py;
      if (pointer.active) {
        const v = Math.hypot(dx, dy) / dt; // px per ms
        pointer.speed = Math.min(1, Math.max(pointer.speed, v / 3.5));
        pointer.vx = dx / dt;
      }
      pointer.px = e.clientX;
      pointer.py = e.clientY;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
      lastT = now;
    },
    { passive: true },
  );
}
