import { Scramble } from "@/components/fx/Scramble";
import { profile, skills } from "@/data/profile";
import { HeroFx } from "./HeroFx";

/**
 * Hero: "FULL" di kiri atas, "STACK" di kanan bawah, tumpukan kubus 3D di antaranya.
 * Kata raksasanya pake `cut` (blend difference): pas numpuk di atas kubus, warnanya kebalik.
 */
export function Hero() {
  // tiga grup skill pertama = tiga lempeng "stack" di scene 3D (atas → bawah)
  const layers = skills.slice(0, 3);

  return (
    <section
      id="top"
      data-chapter="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col px-5 pb-8 pt-20 sm:px-8"
    >
      <HeroFx />

      <p className="text-dim text-small">
        $ whoami <span className="text-(--stage-fg)">{profile.name}</span> / {profile.location}
      </p>

      {/* h1 cuma berisi tiga kata; info + tombol ditaruh di ruang kosong di antara "Full" dan "Stack" */}
      <div className="relative flex flex-1 flex-col">
        <h1 id="hero-title" className="flex flex-1 flex-col">
          <span className="cut display mt-4 block text-hero">
            <Scramble text="Full" when="boot" delay={0.5} duration={0.8} />
          </span>
          {/* ruang kosong: di HP ini "jendela" buat objek 3D, di desktop diisi info + tombol */}
          <span aria-hidden="true" className="block min-h-[36svh] flex-1 lg:min-h-[15rem]" />
          <span className="cut display block text-right text-hero">
            <Scramble text="Stack" when="boot" delay={0.75} duration={0.8} />
          </span>
          <span className="cut display mt-2 block text-right text-h3">
            <Scramble text="Developer" when="boot" delay={1} duration={0.8} />
          </span>
        </h1>

        <div data-in className="panel mt-8 max-w-[40ch] p-1 lg:absolute lg:left-0 lg:top-1/2 lg:mt-0 lg:-translate-y-[60%]">
          <p className="text-lead">{profile.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#projects"
              data-cursor="SCROLL"
              className="bg-accent border border-(--stage-light) px-5 py-3 font-bold hover:bg-transparent hover:text-(--stage-fg)"
            >
              See projects
            </a>
            <a
              href="#contact"
              className="border border-current px-5 py-3 font-bold hover:bg-(--stage-fg) hover:text-(--stage-dark)"
            >
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* label lapisan: nempel di kanan tengah, sejajar tumpukan kubus */}
      <dl
        data-in
        className="panel absolute right-5 top-[30%] hidden w-64 border-l-2 border-(--stage-light) py-1 pl-4 text-small md:block sm:right-8"
      >
        {layers.map((l, i) => (
          <div key={l.group} className="py-1.5">
            <dt className="text-accent font-bold">
              L{layers.length - i} / {l.group}
            </dt>
            <dd className="text-dim">{l.items.slice(0, 2).join(", ")}</dd>
          </div>
        ))}
      </dl>

      <p data-in className="text-dim mt-6 max-w-[46ch] text-small">
        Keep scrolling. The same 4,096 blocks rebuild themselves into every section.
      </p>
    </section>
  );
}
