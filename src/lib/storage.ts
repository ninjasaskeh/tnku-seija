import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Thumbnail project di Neon Object Storage (kompatibel S3).
 * Bucket-nya harus dibikin dengan akses `public_read` (nggak bisa diubah setelah dibuat),
 * jadi gambar bisa langsung ditampilin pake URL publik tanpa presigned URL.
 *
 * Env (diisi otomatis sama `neon deploy` / dari Neon Console):
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION
 * plus STORAGE_BUCKET = nama bucket public_read-nya.
 */
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function storageConfigured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.AWS_REGION &&
      process.env.STORAGE_BUCKET,
  );
}

let client: S3Client | null = null;
function s3() {
  client ??= new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  return client;
}

/** Awalan URL publik bucket: https://<endpoint>/<bucket>/ */
const publicBase = () => `${process.env.AWS_ENDPOINT_URL_S3!.replace(/\/+$/, "")}/${process.env.STORAGE_BUCKET}/`;

/** Upload gambar → URL publiknya. Lempar Error dengan pesan yang aman ditampilin di admin. */
export async function uploadImage(file: File, prefix: string): Promise<string> {
  if (!storageConfigured()) throw new Error("Storage is not configured (see .env.example).");
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Image must be JPG, PNG, WebP or AVIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be 4 MB or smaller.");

  const key = `${prefix}-${Date.now().toString(36)}.${ext}`;
  await s3().send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET!,
      Key: key,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type,
      // nama file selalu baru tiap upload, jadi boleh di-cache browser selamanya
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicBase() + key;
}

/** Hapus gambar lama, cuma kalau URL-nya memang dari bucket kita. Gagal = diabaikan. */
export async function deleteImage(url: string | null | undefined) {
  if (!url || !storageConfigured() || !url.startsWith(publicBase())) return;
  await s3()
    .send(new DeleteObjectCommand({ Bucket: process.env.STORAGE_BUCKET!, Key: url.slice(publicBase().length) }))
    .catch((e) => console.warn("[storage] gagal hapus gambar lama:", (e as Error).message));
}
