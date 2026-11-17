/**
 * Pengukuran jaringan BENERAN dari browser pengunjung ke server ini.
 * rtt = waktu bolak-balik request HEAD ke halaman ini (ms), null kalau belum/nggak bisa diukur
 * (misal build preview yang dibuka dari file://).
 * Pola sama kayak stage.ts: objek mutable + subscribe, dibaca pake useSyncExternalStore.
 */
export const net = {
  rtt: null as number | null,
  best: null as number | null,
  samples: 0,
  /** tipe koneksi dari Network Information API (Chrome doang), mis. "4g" */
  type: null as string | null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribeNet(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Kirim satu request HEAD, balikin RTT dalam ms (atau null kalau gagal). */
export async function ping(): Promise<number | null> {
  if (typeof window === "undefined" || location.protocol === "file:") return null;
  const t0 = performance.now();
  try {
    await fetch(`${location.pathname}?ping=${Math.random().toString(36).slice(2)}`, {
      method: "HEAD",
      cache: "no-store",
    });
  } catch {
    return null;
  }
  const ms = Math.round(performance.now() - t0);
  net.rtt = ms;
  net.best = net.best === null ? ms : Math.min(net.best, ms);
  net.samples++;
  emit();
  return ms;
}

let started = false;

/** Ukur beberapa kali pas awal (sampel pertama biasanya lebih lambat), lalu pelan-pelan tiap 15 detik. */
export function startNet() {
  if (started || typeof window === "undefined") return;
  started = true;
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  net.type = conn?.effectiveType ?? null;
  (async () => {
    for (let i = 0; i < 4; i++) {
      if ((await ping()) === null) return;
      await new Promise((r) => setTimeout(r, 400));
    }
    window.setInterval(() => {
      if (!document.hidden) ping();
    }, 15000);
  })();
}
