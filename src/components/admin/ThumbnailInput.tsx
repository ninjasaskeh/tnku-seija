"use client";

import { useEffect, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX = 4 * 1024 * 1024;

/**
 * Pilih gambar thumbnail: preview langsung di browser sebelum disimpan,
 * cek tipe & ukuran di sini juga (server tetep ngecek ulang).
 */
export function ThumbnailInput({ current, canUpload }: { current: string | null; canUpload: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const shown = preview ?? (remove ? null : current);

  return (
    <div className="grid gap-4 sm:grid-cols-[16rem_1fr]">
      <div className="relative aspect-[16/10] overflow-hidden border border-line bg-line/40">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Thumbnail preview" className="size-full object-cover" />
        ) : (
          <p className="grid size-full place-items-center px-4 text-center text-micro text-ash">
            No image: the site draws generated art
          </p>
        )}
        {preview && <span className="absolute left-2 top-2 bg-acid px-1.5 text-micro font-bold text-ink">NEW</span>}
      </div>

      <div className="space-y-3 text-small">
        {canUpload ? (
          <label className="block">
            <span className="text-ash">Upload image</span>
            <input
              type="file"
              name="thumbnailFile"
              accept={ACCEPT}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setError(null);
                if (!f) return setPreview(null);
                if (!ACCEPT.split(",").includes(f.type)) {
                  e.target.value = "";
                  return setError("Use a JPG, PNG, WebP or AVIF image.");
                }
                if (f.size > MAX) {
                  e.target.value = "";
                  return setError("Image must be 4 MB or smaller.");
                }
                setRemove(false);
                setPreview(URL.createObjectURL(f));
              }}
              className="mt-1.5 block w-full text-ash file:mr-3 file:cursor-pointer file:border-0 file:bg-acid file:px-3 file:py-1.5 file:font-bold file:text-ink hover:file:bg-paper"
            />
            <span className="mt-1 block text-micro text-ash">JPG, PNG, WebP or AVIF · max 4 MB · stored in Neon Object Storage</span>
          </label>
        ) : (
          <p className="border border-dashed border-line p-3 text-micro text-ash">
            Uploads are off. Set the AWS_* storage variables and STORAGE_BUCKET to enable them.
          </p>
        )}
        {error && (
          <p role="alert" className="text-violet">
            {error}
          </p>
        )}
        <label className="block">
          <span className="text-ash">…or image URL / path</span>
          <input
            name="thumbnail"
            defaultValue={current ?? ""}
            placeholder="https://… or /projects/alpha.jpg"
            className="mt-1.5 block w-full border border-line bg-ink px-3 py-2 focus:border-acid focus:outline-none"
          />
        </label>
        {current && (
          <label className="flex items-center gap-2 text-ash">
            <input type="checkbox" name="removeThumbnail" checked={remove} onChange={(e) => setRemove(e.target.checked)} />
            Remove the current image
          </label>
        )}
      </div>
    </div>
  );
}
