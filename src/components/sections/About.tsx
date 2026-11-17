import { Terminal } from "@/components/fx/Terminal";
import { HopHeading } from "@/components/layout/Hop";
import { profile } from "@/data/profile";
import { AboutFx } from "./AboutFx";

/** Sidik jari "sertifikat" palsu tapi deterministik, diturunin dari nama (dekorasi). */
function fingerprint(s: string) {
  let h = 2166136261;
  const out: string[] = [];
  for (let i = 0; i < 8; i++) {
    for (const ch of s + i) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    out.push(((h >>> 0) & 0xff).toString(16).toUpperCase().padStart(2, "0"));
  }
  return out.join(":");
}

/**
 * Hop 02 — Handshake. Kenalan ala TCP/TLS: SYN → SYN-ACK (bio) → ACK,
 * lalu "sertifikat" berisi fakta, lalu terminal buat nanya langsung.
 * Gembok 3D ada di kiri, jadi isi ditaruh di kanan.
 */
export function About() {
  const [lead, ...rest] = profile.bio;
  return (
    <section
      id="about"
      data-chapter="about"
      aria-labelledby="about-title"
      className="relative px-5 pb-[40svh] pt-[18svh] sm:px-8"
    >
      <AboutFx />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-12">
          <HopHeading id="about" titleId="about-title" />
        </div>

        <div className="min-w-0 lg:col-span-7 lg:col-start-6">
          <ol className="max-w-[62ch] space-y-8">
            <li data-step className="panel grid grid-cols-[5.5rem_1fr] gap-x-4 text-small">
              <span className="text-accent font-bold">→ SYN</span>
              <span className="text-dim">client: who&apos;s on the other end?</span>
            </li>
            <li data-step className="panel grid gap-x-4 sm:grid-cols-[5.5rem_1fr] [&>*]:min-w-0">
              <span className="text-accent text-small font-bold">← SYN-ACK</span>
              <div>
                <p data-about-lead className="text-h3 leading-[1.25]">
                  {lead}
                </p>
                {rest.map((p) => (
                  <p key={p} className="text-dim mt-6">
                    {p}
                  </p>
                ))}
              </div>
            </li>
            <li data-step className="panel grid grid-cols-[5.5rem_1fr] gap-x-4 text-small">
              <span className="text-accent font-bold">→ ACK</span>
              <span className="text-dim">client: connection trusted. Show me the certificate.</span>
            </li>
          </ol>

          <figure className="panel line-fg relative mt-12 max-w-[62ch] border">
            <figcaption className="line-fg flex items-center justify-between border-b px-4 py-2 text-small">
              <span className="font-bold">CERTIFICATE</span>
              <span className="bg-accent px-1.5 font-bold">● VALID</span>
            </figcaption>
            <dl className="px-4 py-2">
              <div data-fact className="line-fg grid grid-cols-[7rem_1fr] gap-4 border-b border-dashed py-2.5">
                <dt className="text-dim text-small">Subject</dt>
                <dd>CN={profile.name}</dd>
              </div>
              {profile.facts.map((f) => (
                <div key={f.label} data-fact className="line-fg grid grid-cols-[7rem_1fr] gap-4 border-b border-dashed py-2.5">
                  <dt className="text-dim text-small">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
              <div data-fact className="grid grid-cols-[7rem_1fr] gap-4 py-2.5">
                <dt className="text-dim text-small">Fingerprint</dt>
                <dd className="text-dim break-all text-small">SHA256 {fingerprint(profile.name)}</dd>
              </div>
            </dl>
            <p className="line-fg text-dim border-t px-4 py-2 text-micro">Issuer: self-signed. Verified by shipped work, see next hop.</p>
          </figure>

          <div className="mt-12 max-w-[62ch]">
            <p className="panel text-dim mb-3 inline-block text-small">Socket is open. Ask directly:</p>
            <Terminal />
          </div>
        </div>
      </div>
    </section>
  );
}
