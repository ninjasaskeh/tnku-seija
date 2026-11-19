import { HopHeading } from "@/components/layout/Hop";
import type { Experience as Job, ExperienceKind } from "@/lib/content-types";
import { ExperienceFx } from "./ExperienceFx";

/** Jenis kerjaan → "method" request-nya. Teks jenisnya tetep ditulis di detail, jadi ini cuma bumbu. */
const METHOD: Record<ExperienceKind, string> = {
  "full-time": "PUT",
  "part-time": "PATCH",
  contract: "PATCH",
  freelance: "POST",
  internship: "GET",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ym = (v: string) => {
  const [y, m] = v.split("-").map(Number);
  return { y: y!, m: m! };
};
const fmt = (v: string) => {
  const { y, m } = ym(v);
  return `${MONTHS[m - 1] ?? "?"} ${y}`;
};

/** "https://www.acme.com/x" → "acme.com"; link aneh (mis. "#") → "link". */
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "") || "link";
  } catch {
    return "link";
  }
};

/** Lama kerja dari dua "YYYY-MM" (inklusif). Buat yang masih jalan nggak dihitung: "now" butuh jam, dan halaman ini statis. */
function span(start: string, end: string) {
  const a = ym(start);
  const b = ym(end);
  const months = (b.y - a.y) * 12 + (b.m - a.m) + 1;
  if (months < 1) return null;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y}y`, m && `${m}m`].filter(Boolean).join(" ");
}

/**
 * Hop 04 — Logs. Request udah lewat router; sekarang server nulis log:
 * tiap kerjaan = satu baris di access.log (terbaru dulu). Yang masih jalan = 200 OK,
 * yang udah selesai = 301 (pindah permanen). Semua baris kebuka dari awal; klik baris buat nutup/buka (native <details>).
 * Jendela terminal 3D ada di kanan, jadi isi di kiri.
 */
export function Experience({ experience }: { experience: Job[] }) {
  return (
    <section
      id="logs"
      data-chapter="logs"
      aria-labelledby="logs-title"
      className="relative px-5 pb-[40svh] pt-[18svh] sm:px-8"
    >
      <ExperienceFx />
      <div className="mx-auto max-w-[1400px]">
        <HopHeading id="logs" titleId="logs-title" />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <p className="panel text-dim mb-6 max-w-[52ch]">
              Every place this request has been handled before, newest first. Open a line for the full trace.
            </p>

            <div className="panel line-fg border">
              <p aria-hidden="true" className="line-fg border-b px-3 py-3 text-micro sm:px-4 sm:text-small">
                <span className="text-dim">$ </span>
                tail -n {experience.length} /var/log/career/access.log
                <span className="caret ml-1" />
              </p>

              {experience.length === 0 ? (
                <p className="text-dim px-3 py-6 text-small sm:px-4">
                  tail: access.log: no entries yet. The request is still being processed.
                </p>
              ) : (
                <ol>
                  {experience.map((job) => {
                    const live = !job.end;
                    const length = job.end ? span(job.start, job.end) : null;
                    return (
                      <li key={`${job.company}-${job.start}`} data-log className="line-fg border-b last:border-b-0">
                        <details className="group" open>
                          <summary
                            data-cursor="TRACE"
                            className="flex cursor-pointer list-none flex-col gap-1.5 px-3 py-4 sm:px-4 [&::-webkit-details-marker]:hidden"
                          >
                            <span className="flex items-center justify-between gap-3 text-micro sm:text-small">
                              <span className="text-dim tabular-nums">
                                [{fmt(job.start)} → {job.end ? fmt(job.end) : "now"}]
                              </span>
                              <span className="flex items-center gap-3">
                                {live ? (
                                  <span className="text-accent font-bold">
                                    <span aria-hidden="true">● </span>200 OK
                                  </span>
                                ) : (
                                  <span className="text-dim">301 Moved</span>
                                )}
                                <span
                                  aria-hidden="true"
                                  className="line-fg grid size-[21px] place-items-center border"
                                >
                                  {/* "+" dari 2 garis (glyph font nggak pas di tengah); kebuka = diputer jadi "×".
                                      Ukuran ganjil (21 → isi 19, ikon 9, garis di px ke-4) biar garisnya tajam */}
                                  <span className="relative block size-[9px] transition-transform duration-200 ease-(--ease-snap) group-open:rotate-45 motion-reduce:transition-none">
                                    <span className="absolute inset-x-0 top-[4px] h-px bg-current" />
                                    <span className="absolute inset-y-0 left-[4px] w-px bg-current" />
                                  </span>
                                </span>
                              </span>
                            </span>
                            <span className="text-lead leading-snug">
                              <span className="method mr-2 align-[0.15em] text-small">{METHOD[job.kind]}</span>
                              <span className="font-bold">{job.role}</span>
                              <span className="text-dim"> @ {job.company}</span>
                            </span>
                          </summary>

                          <div className="px-3 pb-6 sm:px-4 sm:pl-[4.5rem]">
                            <p className="text-dim flex flex-wrap gap-x-3 text-small">
                              <span>{job.kind}</span>
                              {job.location && <span>· {job.location}</span>}
                              {length && <span>· {length}</span>}
                            </p>
                            {job.summary && <p className="mt-3 max-w-[60ch]">{job.summary}</p>}
                            {job.highlights.length > 0 && (
                              <ul className="mt-4 max-w-[60ch] space-y-2 text-small">
                                {job.highlights.map((h) => (
                                  <li key={h} className="grid grid-cols-[auto_1fr] gap-x-3">
                                    <span aria-hidden="true" className="text-accent font-bold">
                                      [ok]
                                    </span>
                                    <span>{h}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {(job.stack.length > 0 || job.url) && (
                              <div className="mt-5 flex flex-wrap items-center gap-2 text-micro">
                                {job.stack.map((s) => (
                                  <span key={s} className="line-fg border px-2 py-0.5">
                                    {s}
                                  </span>
                                ))}
                                {job.url && (
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    data-cursor="OPEN"
                                    className="ml-auto font-bold underline underline-offset-4 hover:no-underline"
                                  >
                                    {host(job.url)} ↗
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
