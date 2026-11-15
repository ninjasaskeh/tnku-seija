/* eslint-disable @next/next/no-img-element */
import type { Project } from "@/data/projects";

function Art({ project, index, id }: { project: Project; index: number; id: string }) {
  if (project.thumbnail) {
    return (
      <img
        src={project.thumbnail}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
    );
  }
  const v = index % 4;
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b2bff" />
          <stop offset="1" stopColor="#0a0633" />
        </linearGradient>
        <radialGradient id={`${id}-orb`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#c6ff00" />
          <stop offset="1" stopColor="#b18cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${id}-bg)`} />
      {v === 0 && <circle cx="205" cy="100" r="78" fill={`url(#${id}-orb)`} />}
      {v === 1 && <rect x="120" y="30" width="150" height="140" fill={`url(#${id}-orb)`} />}
      {v === 2 && <path d="M160 18 290 182H30z" fill={`url(#${id}-orb)`} />}
      {v === 3 && (
        <>
          <circle cx="130" cy="100" r="60" fill={`url(#${id}-orb)`} />
          <circle cx="215" cy="100" r="60" fill={`url(#${id}-orb)`} />
        </>
      )}
      <path d="M0 150h320M0 170h320M0 186h320" stroke="#000" strokeOpacity="0.35" />
    </svg>
  );
}

/**
 * Thumbnail project. Pas kartunya di-hover, lapisan dither 1-bit nongol di atasnya.
 * Dither-nya murni CSS: gambar + pola Bayer → contrast() jadi hitam/putih → di-multiply ke acid.
 * Kalau project.thumbnail kosong, dipake gambar generatif per nomor.
 */
export function ProjectThumb({
  project,
  index,
  className = "",
}: {
  project: Project;
  index: number;
  className?: string;
}) {
  return (
    <div
      role={project.thumbnail ? "img" : undefined}
      aria-label={project.thumbnail ? `Screenshot of ${project.title}` : undefined}
      aria-hidden={project.thumbnail ? undefined : true}
      className={`relative isolate overflow-hidden ${className}`}
    >
      <Art project={project} index={index} id={`t${index}`} />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-acid opacity-0 [transition:opacity_240ms_steps(3)] group-hover/card:opacity-100"
      >
        <div className="absolute inset-0 mix-blend-multiply [filter:grayscale(1)_contrast(900)]">
          <Art project={project} index={index} id={`d${index}`} />
          <div className="bayer absolute inset-0 opacity-50" />
        </div>
        <div className="scanlines absolute inset-0" />
      </div>
    </div>
  );
}
