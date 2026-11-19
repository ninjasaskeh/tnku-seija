import { type Camera, type InstancedMesh, Matrix4, Object3D, Raycaster, Vector2, Vector3 } from "three";

/**
 * Sistem kubus: N kubus yang sama, pindah-pindah formasi.
 * Semua dihitung di CPU tiap frame (N ≤ 4096 masih enteng).
 *
 * Konsep ROUND TRIP:
 * - Pindah formasi = data "di-stream": kubus disedot ke satu jalur sempit (kayak lewat kabel),
 *   jatuh ke bawah sambil molor, lalu nyusun bentuk baru. Yang paling atas berangkat duluan.
 * - Sebagian kecil kubus (STREAM) nggak pernah ikut bentuk: jadi paket data yang terus
 *   ngalir turun di dua jalur di belakang objek. Pas pindah bab, alirannya ngebut.
 */

const RADIUS = 14; // setengah bentang tiap bentuk setelah dinormalisasi
const DUR = 1.25; // detik per kubus
const MAX_DELAY = 0.6;
const STREAM = 0.03; // porsi kubus yang jadi aliran paket

type Shape = { pos: Float32Array; scale: Float32Array };

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Generator bentuk ----------
   Tiap fungsi balikin titik-titik grid [x,y,z,...] dan nyesuaiin resolusinya ke jumlah kubus (n),
   biar hampir semua kubus kepake buat bentuknya (desktop 4096, mobile 1400). */

function cube(n: number): number[] {
  const side = Math.max(4, Math.floor(Math.cbrt(n)));
  const p: number[] = [];
  for (let x = 0; x < side; x++) for (let y = 0; y < side; y++) for (let z = 0; z < side; z++) p.push(x, y, z);
  return p;
}

/** Ulangi generator dengan resolusi makin kecil sampai jumlah titiknya muat di n. */
function fit(n: number, from: number, to: number, step: number, gen: (r: number) => number[]): number[] {
  for (let r = from; r >= to; r -= step) {
    const p = gen(r);
    if (p.length / 3 <= n) return p;
  }
  return cube(n);
}

/** Jarak titik ke ruas garis a→b (2D). */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/** Amplop = paket data: lempeng tipis, pinggir + lipatan "V" timbul. */
function packet(n: number): number[] {
  return fit(n, 56, 14, 2, (W) => {
    const H = Math.round(W * 0.62);
    const p: number[] = [];
    const lw = Math.max(0.9, W * 0.035);
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const edge = x < 1 || y < 1 || x > W - 2 || y > H - 2;
        const flap =
          segDist(x, y, 0, H - 1, (W - 1) / 2, H * 0.38) < lw || segDist(x, y, W - 1, H - 1, (W - 1) / 2, H * 0.38) < lw;
        const depth = edge || flap ? 4 : 2;
        for (let z = 0; z < depth; z++) p.push(x, y, z);
      }
    }
    return p;
  });
}

/**
 * Jendela terminal (hop Logs): bingkai + title bar dengan 3 lubang tombol, isinya baris-baris log
 * dengan panjang beda-beda (timestamp pendek, spasi, pesan), baris terakhir = kursor.
 */
function log(n: number): number[] {
  return fit(n, 60, 14, 2, (W) => {
    const H = Math.round(W * 0.68);
    const t = Math.max(1, Math.round(W / 28)); // tebel satu baris teks
    const bar = t * 2 + 1; // tinggi title bar
    const pad = t + 1;
    const LENS = [0.82, 0.55, 0.9, 0.38, 0.7, 0.62, 0.48];
    const stamp = Math.max(2, Math.round(W * 0.16));
    const p: number[] = [];
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        // y naik ke atas: title bar di y paling gede
        const edge = x < 1 || y < 1 || x > W - 2 || y > H - 2;
        const title = y >= H - bar;
        const cy = H - bar - 1 - y + 1; // jarak dari bawah title bar (mulai 1)
        const dot = title && !edge && y === H - 1 - Math.ceil(bar / 2) && [2, 4, 6].some((d) => Math.abs(x - d * t) < Math.max(1, t * 0.6));
        let line = false;
        if (!title && !edge && cy > pad - 1 && x >= pad && y > t) {
          const row = Math.floor((cy - pad) / (t * 2));
          const inRow = (cy - pad) % (t * 2) < t;
          const len = Math.round((W - pad * 2) * LENS[row % LENS.length]!);
          const last = (row + 2) * t * 2 + pad > H - bar - t; // baris terakhir yang masih muat → kursor
          const cx = x - pad;
          line = inRow && (last ? cx < t * 2 : cx < len && (cx < stamp || cx > stamp + t));
        }
        // isinya bolong (tanpa pelat belakang) biar baris-baris log kebaca setelah di-dither
        const depth = edge || (title && !dot) ? 3 : line ? 2 : 0;
        for (let z = 0; z < depth; z++) p.push(x, y, z);
      }
    }
    return p;
  });
}

/** Gembok TLS: badan dengan lubang kunci + busur (shackle) di atas. */
function lock(n: number): number[] {
  return fit(n, 16, 5, 0.5, (R) => {
    const p: number[] = [];
    const lim = Math.ceil(R * 1.4);
    const bodyD = Math.max(3, Math.round(R * 0.5));
    const shD = Math.max(2, Math.round(R * 0.28));
    for (let x = -lim; x <= lim; x++) {
      for (let y = Math.floor(-1.1 * R); y <= Math.ceil(1.3 * R); y++) {
        const body = Math.abs(x) <= R && y <= 0.1 * R && y >= -1.1 * R;
        const hole =
          Math.hypot(x, y + 0.38 * R) < 0.2 * R || (Math.abs(x) < Math.max(0.6, 0.08 * R) && y < -0.38 * R && y > -0.8 * R);
        // busur: dua kaki lurus + setengah lingkaran
        const ax = Math.abs(x);
        const leg = ax >= 0.48 * R && ax <= 0.76 * R && y > 0.1 * R && y <= 0.5 * R;
        const d = Math.hypot(x, y - 0.5 * R);
        const arch = y > 0.5 * R && d >= 0.48 * R && d <= 0.76 * R;
        if (body && !hole) for (let z = 0; z < bodyD; z++) p.push(x, y, z - bodyD / 2);
        else if (leg || arch) for (let z = 0; z < shD; z++) p.push(x, y, z - shD / 2);
      }
    }
    return p;
  });
}

/** Database: tiga cakram bertumpuk, cuma kulitnya (dinding + tutup atas) biar resolusinya tinggi. */
function db(n: number): number[] {
  return fit(n, 22, 6, 0.5, (r) => {
    const h = Math.max(2, Math.round(r * 0.28));
    const gap = Math.max(2, Math.round(r * 0.3));
    const lim = Math.ceil(r);
    const p: number[] = [];
    for (let disc = 0; disc < 3; disc++) {
      const y0 = disc * (h + gap);
      for (let x = -lim; x <= lim; x++) {
        for (let z = -lim; z <= lim; z++) {
          const d = Math.hypot(x, z);
          if (d > r) continue;
          const wall = d > r - 1.3;
          for (let y = 0; y < h; y++) {
            const cap = y === h - 1 || y === 0;
            if (wall || cap) p.push(x, y0 + y, z);
          }
        }
      }
    }
    return p;
  });
}

/** Jantung (hop Keep-Alive = heartbeat): kurva hati klasik, tebel & cembung di tengah. */
function heart(n: number): number[] {
  return fit(n, 18, 5, 0.5, (R) => {
    const p: number[] = [];
    const lim = Math.ceil(R * 1.3);
    for (let x = -lim; x <= lim; x++) {
      for (let y = -lim; y <= lim; y++) {
        // (x²+y²-1)³ - x²y³ ≤ 0, dinormalisasi ke radius R
        const u = x / R;
        const v = y / R + 0.15;
        const f = (u * u + v * v - 1) ** 3 - u * u * v ** 3;
        if (f > 0) continue;
        const depth = Math.max(2, Math.round(R * 0.35 * (1 - Math.min(1, Math.hypot(u, v - 0.2) * 0.6))) + 1);
        for (let z = 0; z < depth; z++) p.push(x, y, z - depth / 2);
      }
    }
    return p;
  });
}

/** Teks/simbol apa pun → voxel: digambar ke canvas 2D kecil, tiap pixel yang keisi jadi kolom kubus. */
function glyph(n: number, text: string, font: string, w: number, h: number): number[] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return cube(n);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  ctx.fillText(text, w / 2, h / 2 + 1);
  const data = ctx.getImageData(0, 0, w, h).data;
  const flat: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 110) flat.push(x, -y);
  const cells = flat.length / 2;
  if (!cells) return cube(n);
  // tebel ekstrusi dipilih biar jumlah kubusnya mendekati n
  const depth = Math.min(9, Math.max(1, Math.floor((n * 0.97) / cells)));
  const p: number[] = [];
  for (let i = 0; i < flat.length; i += 2) for (let z = 0; z < depth; z++) p.push(flat[i], flat[i + 1], z);
  return p;
}

const FONT = '"Archivo Variable", "Arial Black", sans-serif';

function points(id: string, n: number): number[] {
  if (id === "packet") return packet(n);
  if (id === "lock") return lock(n);
  if (id === "log") return log(n);
  if (id === "db") return db(n);
  if (id === "heart") return heart(n);
  if (id === "ok") return glyph(n, "200", `900 30px ${FONT}`, 66, 32);
  if (id.startsWith("route")) {
    const label = String(Number(id.slice(5)) + 1).padStart(2, "0");
    return glyph(n, `/${label}`, `900 30px ${FONT}`, 70, 32);
  }
  return cube(n);
}

/** Tengahin, samain ukuran, lalu petain ke kubus bentuk. Kubus kelebihan disembunyiin (skala 0). */
function build(id: string, count: number): Shape {
  const pts = points(id, count);
  const m = pts.length / 3;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pts.length; i++) {
    const a = i % 3;
    if (pts[i] < min[a]) min[a] = pts[i];
    if (pts[i] > max[a]) max[a] = pts[i];
  }
  const span = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) + 1;
  const f = (RADIUS * 2) / span;

  // urutan acak tapi deterministik → kubus saling silang pas pindah formasi
  const rand = mulberry32(1337 + id.length * 97 + id.charCodeAt(id.length - 1));
  const order = Array.from({ length: m }, (_, i) => i);
  for (let i = m - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const pos = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const k = order[i % m] * 3;
    pos[i * 3] = (pts[k] - (min[0] + max[0]) / 2) * f;
    pos[i * 3 + 1] = (pts[k + 1] - (min[1] + max[1]) / 2) * f;
    pos[i * 3 + 2] = (pts[k + 2] - (min[2] + max[2]) / 2) * f;
    scale[i] = i < m ? f * 0.8 : 0; // 0.8 = sisain celah antar kubus
  }
  return { pos, scale };
}

export class VoxelSystem {
  shapeId = "";
  private shapes = new Map<string, Shape>();
  /** kubus [0, body) = bentuk, [body, count) = aliran paket */
  private body: number;
  private cur: Float32Array;
  private from: Float32Array;
  private to: Float32Array;
  private curS: Float32Array;
  private fromS: Float32Array;
  private toS: Float32Array;
  private delay: Float32Array;
  private jitter: Float32Array;
  private rot: Float32Array;
  /** aliran: x, z, fase, kecepatan */
  private lane: Float32Array;
  private clock = 99;
  private flow = 0;

  private dummy = new Object3D();
  private inv = new Matrix4();
  private raycaster = new Raycaster();
  private ndc = new Vector2();
  private o = new Vector3();
  private d = new Vector3();

  constructor(
    private mesh: InstancedMesh,
    private count: number,
  ) {
    const n = count;
    this.body = n - Math.round(n * STREAM);
    this.cur = new Float32Array(n * 3);
    this.from = new Float32Array(n * 3);
    this.to = new Float32Array(n * 3);
    this.curS = new Float32Array(n);
    this.fromS = new Float32Array(n);
    this.toS = new Float32Array(n);
    this.delay = new Float32Array(n);
    this.jitter = new Float32Array(n);
    this.rot = new Float32Array(n * 2);
    this.lane = new Float32Array(n * 4);

    const rand = mulberry32(7);
    for (let i = 0; i < n; i++) {
      this.jitter[i] = rand();
      this.rot[i * 2] = (rand() - 0.5) * Math.PI;
      this.rot[i * 2 + 1] = (rand() - 0.5) * Math.PI;
      // dua jalur kabel di belakang objek, kiri & kanan; tiap paket sedikit geser dari jalurnya
      const side = rand() < 0.5 ? -1 : 1;
      this.lane[i * 4] = side * RADIUS * (1.38 + rand() * 0.1) + (rand() - 0.5) * 0.9;
      this.lane[i * 4 + 1] = -RADIUS * 0.6 + (rand() - 0.5) * 1.2;
      this.lane[i * 4 + 2] = rand();
      this.lane[i * 4 + 3] = (0.025 + rand() * 0.035) * (side < 0 ? 1 : 1.3);
    }

    const start = this.shape("cube");
    this.cur.set(start.pos);
    this.to.set(start.pos);
    this.from.set(start.pos);
    this.curS.set(start.scale);
    this.toS.set(start.scale);
    this.fromS.set(start.scale);
    this.shapeId = "cube";
  }

  private shape(id: string) {
    let s = this.shapes.get(id);
    if (!s) {
      s = build(id, this.body);
      this.shapes.set(id, s);
    }
    return s;
  }

  setShape(id: string) {
    const target = this.shape(id);
    this.from.set(this.cur.subarray(0, this.body * 3));
    this.fromS.set(this.curS.subarray(0, this.body));
    this.to.set(target.pos);
    this.toS.set(target.scale);

    // yang paling atas berangkat duluan → kesannya data ngalir ke bawah
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < this.body; i++) {
      const y = this.from[i * 3 + 1];
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
    const range = Math.max(0.001, hi - lo);
    for (let i = 0; i < this.body; i++) {
      const top = (hi - this.from[i * 3 + 1]) / range;
      this.delay[i] = top * MAX_DELAY * 0.8 + this.jitter[i] * MAX_DELAY * 0.2;
    }
    this.clock = 0;
    this.shapeId = id;
  }

  /**
   * @param px,py posisi mouse -1..1 (y ke bawah positif), atau null kalau nggak ada mouse
   * @param speed kecepatan mouse 0..1 → radius & kekuatan dorongan
   * @param rush 0..1 → aliran paket ngebut (dipake pas pindah bab)
   * @param stream false → aliran paket disembunyiin (calm mode)
   */
  update(dt: number, camera: Camera, px: number | null, py: number, speed: number, rush: number, stream = true) {
    const { mesh, count, body, cur, from, to, curS, fromS, toS, delay, rot, lane, dummy, o, d } = this;
    const arr = mesh.instanceMatrix.array as Float32Array;
    this.clock += dt;
    this.flow += dt * (1 + rush * 3);
    const clock = this.clock;
    const flow = this.flow;
    const moving = clock < DUR + MAX_DELAY;

    // sinar mouse → ruang lokal mesh
    const useRay = px !== null;
    if (useRay) {
      this.ndc.set(px, -py);
      this.raycaster.setFromCamera(this.ndc, camera);
      this.inv.copy(mesh.matrixWorld).invert();
      o.copy(this.raycaster.ray.origin).applyMatrix4(this.inv);
      d.copy(this.raycaster.ray.direction).transformDirection(this.inv);
    }
    const R = 4.5 + speed * 9;
    const K = 2.5 + speed * 12;
    const span = RADIUS * 3.2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x: number;
      let y: number;
      let z: number;
      let s: number;
      let sy: number;
      let p = 1;
      let pinch = 0;

      if (i >= body) {
        // aliran paket: turun terus, muter balik ke atas
        const l = i * 4;
        const t = (lane[l + 2] + flow * lane[l + 3]) % 1;
        x = lane[l];
        z = lane[l + 1];
        y = span / 2 - t * span;
        // nongol & ilang pelan di ujung atas/bawah
        const fade = Math.min(1, t * 6, (1 - t) * 6);
        s = stream ? (0.24 + (i % 5) * 0.04) * fade : 0;
        sy = s * (2 + rush * 2);
      } else {
        x = to[i3];
        y = to[i3 + 1];
        z = to[i3 + 2];
        s = toS[i];
        sy = s;

        if (moving) {
          p = Math.min(1, Math.max(0, (clock - delay[i]) / DUR));
          const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
          // disedot ke jalur tengah (x,z → 0), jatuh ke bawah, lalu nyebar lagi
          pinch = Math.sin(Math.PI * p);
          const squeeze = 1 - pinch * 0.86;
          x = (from[i3] + (x - from[i3]) * e) * squeeze;
          y = from[i3 + 1] + (y - from[i3 + 1]) * e - pinch * 4;
          z = (from[i3 + 2] + (z - from[i3 + 2]) * e) * squeeze;
          s = fromS[i] + (s - fromS[i]) * e;
          sy = s * (1 + pinch * 1.1);
          cur[i3] = x;
          cur[i3 + 1] = y;
          cur[i3 + 2] = z;
          curS[i] = s;
        }
      }

      if (useRay) {
        // jarak kubus ke sinar mouse; yang deket didorong menjauh
        const vx = x - o.x;
        const vy = y - o.y;
        const vz = z - o.z;
        const t = vx * d.x + vy * d.y + vz * d.z;
        const cx = vx - d.x * t;
        const cy = vy - d.y * t;
        const cz = vz - d.z * t;
        const dist = Math.sqrt(cx * cx + cy * cy + cz * cz);
        if (dist < R && dist > 0.0001) {
          const push = ((1 - dist / R) ** 2 * K) / dist;
          x += cx * push;
          y += cy * push;
          z += cz * push;
        }
      }

      const m = i * 16;
      if (pinch === 0) {
        // diam / aliran: matriks skala + translasi langsung (jalur cepat)
        arr[m] = s; arr[m + 1] = 0; arr[m + 2] = 0; arr[m + 3] = 0;
        arr[m + 4] = 0; arr[m + 5] = sy; arr[m + 6] = 0; arr[m + 7] = 0;
        arr[m + 8] = 0; arr[m + 9] = 0; arr[m + 10] = s; arr[m + 11] = 0;
        arr[m + 12] = x; arr[m + 13] = y; arr[m + 14] = z; arr[m + 15] = 1;
      } else {
        // lagi lewat "kabel": molor + sedikit muter
        dummy.position.set(x, y, z);
        dummy.rotation.set(rot[i * 2] * pinch, rot[i * 2 + 1] * pinch, 0);
        dummy.scale.set(s, sy, s);
        dummy.updateMatrix();
        dummy.matrix.toArray(arr, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
