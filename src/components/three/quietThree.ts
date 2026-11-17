import { setConsoleFunction } from "three";

/**
 * @react-three/fiber 9.x (termasuk 9.8.2, versi stable terbaru) masih bikin `new THREE.Clock()`
 * di dalam store-nya, dan three r183+ nge-warn "Clock: This module has been deprecated" tiap kali.
 * Itu bukan dari kode kita dan nggak bisa dibenerin di sini, jadi CUMA pesan itu yang dibuang.
 * Semua log/warn/error three lainnya tetep diterusin apa adanya.
 *
 * Hapus file ini (dan import-nya di StageScene.tsx) kalau R3F udah pindah ke THREE.Timer.
 */
const MUTED = "THREE.Clock: This module has been deprecated";

type StackTrace = { isStackTrace: true; getError: (message: string) => Error };

const isStackTrace = (v: unknown): v is StackTrace =>
  typeof v === "object" && v !== null && (v as { isStackTrace?: boolean }).isStackTrace === true;

setConsoleFunction((type, message, ...params) => {
  if (message.startsWith(MUTED)) return;
  // sama kayak perilaku bawaan three kalau nggak ada console function custom
  if (isStackTrace(params[0])) console[type](params[0].getError(message));
  else console[type](message, ...params);
});
