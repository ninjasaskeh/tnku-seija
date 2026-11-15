import { type Camera, type InstancedMesh, Matrix4, Object3D, Raycaster, Vector2, Vector3 } from "three";

/**
 * Sistem kubus: N kubus yang sama, pindah-pindah formasi.
 * Semua dihitung di CPU tiap frame (N ≤ 4096 masih enteng):
 * posisi = lerp(asal → tujuan) + lengkungan "ledakan" di tengah jalan + dorongan dari mouse.
 */

const RADIUS = 14; // setengah bentang tiap bentuk setelah dinormalisasi
const DUR = 1.15; // detik per kubus
const MAX_DELAY = 0.55;

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
   Tiap fungsi balikin titik-titik grid [x,y,z,...] dan nyesuaiin ukurannya ke jumlah kubus (n),
   biar hampir semua kubus kepake buat bentuknya (desktop 4096, mobile 1400). */

function cube(n: number): number[] {
  const side = Math.max(4, Math.floor(Math.cbrt(n)));
  const p: number[] = [];
  for (let x = 0; x < side; x++) for (let y = 0; y < side; y++) for (let z = 0; z < side; z++) p.push(x, y, z);
  return p;
}

/** Tiga lempeng bertumpuk = "stack": interface / API / data. */
function stack(n: number): number[] {
  const side = Math.max(6, Math.floor(Math.sqrt((n * 0.9) / 9)));
  const gap = Math.round(side * 0.45);
  const p: number[] = [];
  for (let layer = 0; layer < 3; layer++)
    for (let x = 0; x < side; x++)
      for (let z = 0; z < side; z++) for (let y = 0; y < 3; y++) p.push(x, layer * gap + y, z);
  return p;
}

/** Smiley acid: cakram cembung dengan lubang mata + mulut. Radius dikecilin sampai muat di n kubus. */
function face(n: number): number[] {
  for (let R = 12.5; R >= 5; R -= 0.5) {
    const p: number[] = [];
    const lim = Math.floor(R);
    for (let x = -lim; x <= lim; x++) {
      for (let y = -lim; y <= lim; y++) {
        const d = Math.hypot(x, y);
        if (d > R) continue;
        const eye = ((Math.abs(x) - 0.36 * R) / (0.14 * R)) ** 2 + ((y - 0.28 * R) / (0.23 * R)) ** 2 < 1;
        const mouth = y < -0.12 * R && Math.abs(Math.hypot(x, y - 0.08 * R) - 0.58 * R) < Math.max(0.8, 0.09 * R);
        if (eye || mouth) continue;
        const depth = Math.max(2, Math.round(R * 0.25)) + Math.floor(R * 0.6 * Math.sqrt(1 - (d / R) ** 2));
        for (let z = 0; z < depth; z++) p.push(x, y, z - depth / 2);
      }
    }
    if (p.length / 3 <= n * 0.95) return p;
  }
  return cube(n);
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
  const depth = Math.min(9, Math.max(1, Math.floor((n * 0.93) / cells)));
  const p: number[] = [];
  for (let i = 0; i < flat.length; i += 2) for (let z = 0; z < depth; z++) p.push(flat[i], flat[i + 1], z);
  return p;
}

function points(id: string, n: number): number[] {
  if (id === "stack") return stack(n);
  if (id === "face") return face(n);
  if (id === "code") return glyph(n, "</>", '900 30px "Archivo Variable", "Arial Black", sans-serif', 64, 34);
  if (id === "at") return glyph(n, "@", '900 46px "Archivo Variable", "Arial Black", sans-serif', 50, 54);
  if (id.startsWith("num")) {
    const label = String(Number(id.slice(3)) + 1).padStart(2, "0");
    return glyph(n, label, '900 30px "Archivo Variable", "Arial Black", sans-serif', 50, 30);
  }
  return cube(n);
}

/** Tengahin, samain ukuran, lalu petain ke N kubus. Sisa kubus: sedikit jadi "debu", sisanya disembunyiin. */
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

  const dust = Math.round(count * 0.06);
  const pos = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    if (i < m || i >= m + dust) {
      // bagian dari bentuk; kubus kelebihan ngumpet (skala 0) di dalem bentuknya
      const k = order[i % m] * 3;
      pos[i * 3] = (pts[k] - (min[0] + max[0]) / 2) * f;
      pos[i * 3 + 1] = (pts[k + 1] - (min[1] + max[1]) / 2) * f;
      pos[i * 3 + 2] = (pts[k + 2] - (min[2] + max[2]) / 2) * f;
      scale[i] = i < m ? f * 0.8 : 0; // 0.8 = sisain celah antar kubus
    } else {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const r = RADIUS * (1.35 + rand() * 0.9);
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * s * r;
      pos[i * 3 + 1] = u * r * 0.75;
      pos[i * 3 + 2] = Math.sin(a) * s * r;
      scale[i] = 0.3 + rand() * 0.4;
    }
  }
  return { pos, scale };
}

export class VoxelSystem {
  shapeId = "";
  private shapes = new Map<string, Shape>();
  private cur: Float32Array;
  private from: Float32Array;
  private to: Float32Array;
  private curS: Float32Array;
  private fromS: Float32Array;
  private toS: Float32Array;
  private delay: Float32Array;
  private dir: Float32Array;
  private rot: Float32Array;
  private clock = 99;

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
    this.cur = new Float32Array(n * 3);
    this.from = new Float32Array(n * 3);
    this.to = new Float32Array(n * 3);
    this.curS = new Float32Array(n);
    this.fromS = new Float32Array(n);
    this.toS = new Float32Array(n);
    this.delay = new Float32Array(n);
    this.dir = new Float32Array(n * 3);
    this.rot = new Float32Array(n * 2);

    const rand = mulberry32(7);
    for (let i = 0; i < n; i++) {
      this.delay[i] = rand() * MAX_DELAY;
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      this.dir[i * 3] = Math.cos(a) * s;
      this.dir[i * 3 + 1] = u;
      this.dir[i * 3 + 2] = Math.sin(a) * s;
      this.rot[i * 2] = (rand() - 0.5) * Math.PI * 4;
      this.rot[i * 2 + 1] = (rand() - 0.5) * Math.PI * 4;
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
      s = build(id, this.count);
      this.shapes.set(id, s);
    }
    return s;
  }

  setShape(id: string) {
    const target = this.shape(id);
    this.from.set(this.cur);
    this.fromS.set(this.curS);
    this.to.set(target.pos);
    this.toS.set(target.scale);
    this.clock = 0;
    this.shapeId = id;
  }

  /**
   * @param px,py posisi mouse -1..1 (y ke bawah positif), atau null kalau nggak ada mouse
   * @param speed kecepatan mouse 0..1 → radius & kekuatan dorongan
   */
  update(dt: number, camera: Camera, px: number | null, py: number, speed: number) {
    const { mesh, count, cur, from, to, curS, fromS, toS, delay, dir, rot, dummy, o, d } = this;
    const arr = mesh.instanceMatrix.array as Float32Array;
    this.clock += dt;
    const clock = this.clock;
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

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = to[i3];
      let y = to[i3 + 1];
      let z = to[i3 + 2];
      let s = toS[i];
      let p = 1;

      if (moving) {
        p = Math.min(1, Math.max(0, (clock - delay[i]) / DUR));
        const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
        const arc = Math.sin(Math.PI * p) * 9;
        x = from[i3] + (x - from[i3]) * e + dir[i3] * arc;
        y = from[i3 + 1] + (y - from[i3 + 1]) * e + dir[i3 + 1] * arc;
        z = from[i3 + 2] + (z - from[i3 + 2]) * e + dir[i3 + 2] * arc;
        s = fromS[i] + (s - fromS[i]) * e;
        cur[i3] = x;
        cur[i3 + 1] = y;
        cur[i3 + 2] = z;
        curS[i] = s;
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
      if (p >= 1) {
        // diam: matriks skala + translasi langsung (jalur cepat)
        arr[m] = s; arr[m + 1] = 0; arr[m + 2] = 0; arr[m + 3] = 0;
        arr[m + 4] = 0; arr[m + 5] = s; arr[m + 6] = 0; arr[m + 7] = 0;
        arr[m + 8] = 0; arr[m + 9] = 0; arr[m + 10] = s; arr[m + 11] = 0;
        arr[m + 12] = x; arr[m + 13] = y; arr[m + 14] = z; arr[m + 15] = 1;
      } else {
        // lagi terbang: sambil jungkir balik
        const k = 1 - p;
        dummy.position.set(x, y, z);
        dummy.rotation.set(rot[i * 2] * k, rot[i * 2 + 1] * k, 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        dummy.matrix.toArray(arr, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
