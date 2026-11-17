import { Reassemble } from "@/components/fx/Reassemble";
import { RequestHeaders } from "@/components/fx/RequestHeaders";
import { profile } from "@/data/profile";
import { HeroFx } from "./HeroFx";

/**
 * Hop 01 — Request. Pengunjung baru aja ngirim "GET /you".
 * "GET" di kiri atas, "/YOU" di kanan bawah, paket 3D (amplop) melayang di antaranya.
 * Hurufnya dateng sebagai paket acak (Reassemble). Kata raksasanya pake `cut` (blend difference).
 */
export function Hero() {
  return (
    <section
      id="top"
      data-chapter="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col px-5 pb-8 pt-20 sm:px-8"
    >
      <HeroFx />

      <p data-node className="panel text-dim inline-flex w-fit flex-wrap gap-x-3 text-small">
        <span className="text-accent font-bold">HOP 01/05</span>
        <span>L0 / CLIENT</span>
        <span>
          {profile.name} — {profile.role}, {profile.location}
        </span>
      </p>

      <div className="relative flex flex-1 flex-col">
        <h1 id="hero-title" className="flex flex-1 flex-col">
          <span className="sr-only">
            {profile.name}, {profile.role}.
          </span>
          <span className="cut display mt-6 block text-hero">
            <Reassemble text="GET" when="boot" delay={0.4} />
          </span>
          {/* ruang kosong: di HP ini "jendela" buat paket 3D, di desktop diisi info + tombol */}
          <span aria-hidden="true" className="block min-h-[36svh] flex-1 lg:min-h-[15rem]" />
          <span className="cut display block text-right text-hero">
            <Reassemble text="/YOU" when="boot" delay={0.7} />
          </span>
          <span aria-hidden="true" className="cut mt-2 block text-right text-small">
            HTTP/2 · {profile.role.toUpperCase()} · 5 HOPS
          </span>
        </h1>

        {/* lg: nempel tepat di bawah "GET" (tinggi baris = ukuran text-hero × line-height 0.88 + mt-6) */}
        <div
          data-in
          className="panel mt-8 max-w-[40ch] p-1 lg:absolute lg:left-0 lg:top-[calc(min(19vw,26svh)*0.88+3rem)] lg:mt-0"
        >
          <p className="text-lead">{profile.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#about"
              data-cursor="SEND"
              className="bg-accent border border-(--stage-light) px-5 py-3 font-bold hover:bg-transparent hover:text-(--stage-fg)"
            >
              Send request ↓
            </a>
            <a
              href="#contact"
              data-cursor="200"
              className="border border-current px-5 py-3 font-bold hover:bg-(--stage-fg) hover:text-(--stage-dark)"
            >
              Skip to response
            </a>
          </div>
        </div>
      </div>

      {/* header request milik pengunjung: nempel di kanan, sejajar paket 3D */}
      <div
        data-in
        className="panel line-fg absolute right-5 top-[24%] hidden w-72 border-l-2 border-l-(--stage-light) py-2 pl-4 text-small md:block sm:right-8"
      >
        <p className="font-bold">
          <span className="method">GET</span> /you HTTP/2
        </p>
        <div className="mt-2">
          <RequestHeaders />
        </div>
        <p className="text-dim mt-2 text-micro">↑ that&apos;s you. Live from your browser.</p>
      </div>

      <p data-in className="text-dim mt-6 max-w-[56ch] text-small">
        <span className="panel">
          You are the request. Scroll to travel the stack and come back with a response. Click anywhere empty to ping the server for real.
        </span>
      </p>
    </section>
  );
}
