import { Scramble } from "@/components/fx/Scramble";
import { Terminal } from "@/components/fx/Terminal";
import { profile } from "@/data/profile";
import { AboutFx } from "./AboutFx";

export function About() {
  const [lead, ...rest] = profile.bio;
  return (
    <section
      id="about"
      data-chapter="about"
      aria-labelledby="about-title"
      className="relative px-5 pb-[45svh] pt-[22svh] sm:px-8"
    >
      <AboutFx />
      <div className="mx-auto grid max-w-[1400px] gap-y-12 lg:grid-cols-12 lg:gap-x-10">
        <h2 id="about-title" className="cut display text-mega lg:col-span-12">
          <Scramble text="About" />
        </h2>

        {/* objek 3D ada di kiri, jadi isi ditaruh di kanan */}
        <div className="lg:col-span-7 lg:col-start-6">
          <div className="panel max-w-[60ch] py-2">
            <p data-about-lead className="text-h3 leading-[1.25]">
              {lead}
            </p>
            {rest.map((p) => (
              <p key={p} className="text-dim mt-6">
                {p}
              </p>
            ))}
          </div>

          <dl className="panel line-fg mt-10 max-w-[60ch] border-t">
            {profile.facts.map((f) => (
              <div key={f.label} data-fact className="line-fg grid grid-cols-[6.5rem_1fr] gap-4 border-b py-3">
                <dt className="text-dim text-small">{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 max-w-[60ch]">
            <p className="panel text-dim mb-3 inline-block text-small">Or ask the terminal directly:</p>
            <Terminal />
          </div>
        </div>
      </div>
    </section>
  );
}
