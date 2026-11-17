import { CopyEmail } from "@/components/fx/CopyEmail";
import { LocalClock } from "@/components/fx/LocalClock";
import { Magnetic } from "@/components/fx/Magnetic";
import { Rtt } from "@/components/fx/NetStatus";
import { RoundTrip } from "@/components/fx/RoundTrip";
import { Scramble } from "@/components/fx/Scramble";
import { HopHeading } from "@/components/layout/Hop";
import { profile } from "@/data/profile";
import { ContactFx } from "./ContactFx";

/**
 * Hop 05 — Response. Request balik ke pengunjung: 200 OK.
 * Kontak ditulis sebagai header response; email = header Location.
 * Di bawah: total round trip (lama pengunjung di halaman) + nama raksasa.
 */
export function Contact() {
  return (
    <section
      id="contact"
      data-chapter="contact"
      aria-labelledby="contact-title"
      className="relative overflow-hidden pt-[18svh]"
    >
      <ContactFx />
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <HopHeading id="contact" titleId="contact-title" />

        <div className="mt-10 lg:max-w-[56%]">
          <p className="panel display text-h2">
            HTTP/2 200 OK
          </p>
          <p className="panel mt-6 max-w-[46ch] text-lead">
            Your request made it back. Have a project or a role that fits? Send an email. I usually reply within a day
            or two.
          </p>

          <dl className="panel mt-8 space-y-1 border-y border-current py-3 text-small">
            <div data-hdr className="break-words">
              <dt className="mr-2 inline font-bold">Content-Type:</dt>
              <dd className="inline">human/collaboration</dd>
            </div>
            <div data-hdr className="break-words">
              <dt className="mr-2 inline font-bold">Location:</dt>
              {/* email di baris sendiri, ukuran ngikut lebar layar biar nggak kepotong di tengah kata */}
              <dd className="mt-1 block">
                <a
                  href={`mailto:${profile.email}`}
                  data-cursor="EMAIL"
                  className="text-[clamp(1.05rem,5.4vw,1.5rem)] font-bold [overflow-wrap:anywhere] underline decoration-2 underline-offset-8 hover:bg-(--stage-fg) hover:text-(--stage-dark)"
                >
                  <Scramble text={profile.email} when="hover" />
                </a>
              </dd>
            </div>
            {profile.socials.map((s) => (
              <div data-hdr key={s.label} className="break-words">
                <dt className="mr-2 inline font-bold">Link:</dt>
                <dd className="inline">
                  &lt;
                  <a href={s.href} className="underline underline-offset-4 hover:bg-(--stage-fg) hover:text-(--stage-dark)">
                    {s.href.replace(/^https?:\/\//, "")}
                  </a>
                  &gt;; rel=&quot;{s.label.toLowerCase()}&quot;
                </dd>
              </div>
            ))}
            <div data-hdr className="break-words">
              <dt className="mr-2 inline font-bold">X-Reply-Within:</dt>
              <dd className="inline">24–48h</dd>
            </div>
            <div data-hdr className="break-words">
              <dt className="mr-2 inline font-bold">X-Local-Time:</dt>
              <dd className="inline">
                <LocalClock timeZone={profile.timezone} label={profile.timezoneLabel} />
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CopyEmail email={profile.email} />
            {profile.socials.map((s) => (
              <Magnetic key={s.label}>
                <a
                  href={s.href}
                  className="panel inline-block border border-current px-5 py-3 font-bold hover:bg-(--stage-fg) hover:text-(--stage-dark)"
                >
                  {s.label}
                </a>
              </Magnetic>
            ))}
          </div>

          <p className="panel mt-14 inline-block border-2 border-current px-4 py-3 text-small">
            <span className="font-bold">✓ Round trip complete.</span> Time on this request:{" "}
            <span className="font-bold">
              <RoundTrip />
            </span>
            . Best real ping to this server: <span className="font-bold"><Rtt best /></span>
          </p>
        </div>
      </div>

      <div data-bigname-wrap aria-hidden="true" className="mt-[18svh] overflow-hidden">
        <p
          data-bigname
          // ukuran huruf ngikutin panjang nama biar selalu muat selebar layar
          style={{ fontSize: `${Math.min(17, 112 / profile.name.length)}vw` }}
          className="cut display whitespace-nowrap text-center leading-[0.8]"
        >
          {profile.name}
        </p>
      </div>

      <footer className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-6 text-small sm:px-8">
        <p>
          Connection: close · © 2026 {profile.name}. {profile.role}.
        </p>
        <a href="#top" className="underline-offset-4 hover:underline">
          Send another request ↑
        </a>
      </footer>
    </section>
  );
}
