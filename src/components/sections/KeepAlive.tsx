import { HopHeading } from "@/components/layout/Hop";
import type { Profile } from "@/lib/content-types";
import { KeepAliveFx } from "./KeepAliveFx";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Hop 06 — Keep-Alive. "Connection: keep-alive" = yang bikin koneksi (dan pemilik situs) tetep nyala:
 * cerita perjalanannya. Tiap paragraf `profile.story` = satu "detak" di timeline.
 * Jantung 3D ada di kanan, jadi isi di kiri.
 */
export function KeepAlive({ profile }: { profile: Profile }) {
  const beats = profile.story?.length ? profile.story : ["Story coming soon. The connection is still open."];
  return (
    <section
      id="keepalive"
      data-chapter="keepalive"
      aria-labelledby="keepalive-title"
      className="relative px-5 pb-[40svh] pt-[18svh] sm:px-8"
    >
      <KeepAliveFx />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-12">
          <HopHeading id="keepalive" titleId="keepalive-title" />
        </div>

        <div className="min-w-0 lg:col-span-7">
          <p className="panel inline-flex flex-wrap gap-x-3 text-small">
            <span className="font-bold">Connection: keep-alive</span>
            <span className="text-dim">Keep-Alive: timeout=∞, max=∞</span>
          </p>

          <ol className="relative mt-10 max-w-[60ch] space-y-10">
            {/* garis detak: putus-putus dari detak pertama sampai terakhir */}
            <span aria-hidden="true" className="wire-y absolute bottom-2 left-[5px] top-2 opacity-40" />
            {beats.map((text, i) => (
              <li key={i} data-beat className="relative grid grid-cols-[1rem_1fr] gap-x-4">
                <span aria-hidden="true" className="relative mt-1.5 block size-3 bg-(--stage-fg)">
                  {i === beats.length - 1 && (
                    <span className="absolute inset-0 animate-ping bg-(--stage-fg) opacity-60 motion-reduce:hidden" />
                  )}
                </span>
                <div className="panel">
                  <p className="text-micro font-bold tracking-wider">BEAT {pad(i + 1)}</p>
                  <p className={i === 0 ? "mt-1 text-h3 leading-[1.3]" : "mt-1 text-lead leading-relaxed"}>{text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="panel mt-12 inline-block text-small">
            <span className="text-dim">Still alive.</span>{" "}
            <a href="#contact" className="font-bold underline underline-offset-4 hover:no-underline">
              Send the response ↓
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
