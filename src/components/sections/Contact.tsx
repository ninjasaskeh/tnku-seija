import { CopyEmail } from "@/components/fx/CopyEmail";
import { LocalClock } from "@/components/fx/LocalClock";
import { Magnetic } from "@/components/fx/Magnetic";
import { Scramble } from "@/components/fx/Scramble";
import { profile } from "@/data/profile";
import { ContactFx } from "./ContactFx";

export function Contact() {
  return (
    <section
      id="contact"
      data-chapter="contact"
      aria-labelledby="contact-title"
      className="relative overflow-hidden pt-[22svh]"
    >
      <ContactFx />
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 id="contact-title" className="cut display text-mega">
          <Scramble text="Contact" />
        </h2>

        <div className="mt-12 lg:max-w-[52%]">
          <p className="panel max-w-[44ch] py-1 text-lead">
            Have a project or a role that fits? Send an email. I usually reply within a day or two.
          </p>
          <p className="mt-8">
            <a
              href={`mailto:${profile.email}`}
              data-cursor="EMAIL"
              className="panel break-all text-h3 font-bold underline decoration-2 underline-offset-8 hover:bg-(--stage-fg) hover:text-(--stage-dark)"
            >
              <Scramble text={profile.email} when="hover" />
            </a>
          </p>
          <div className="mt-8">
            <CopyEmail email={profile.email} />
          </div>
          <ul className="mt-10 flex flex-wrap gap-3">
            {profile.socials.map((s) => (
              <li key={s.label}>
                <Magnetic>
                  <a
                    href={s.href}
                    className="panel inline-block border border-current px-5 py-3 font-bold hover:bg-(--stage-fg) hover:text-(--stage-dark)"
                  >
                    {s.label}
                  </a>
                </Magnetic>
              </li>
            ))}
          </ul>
          <p className="panel mt-14 border-t border-current pt-4 text-small">
            My local time right now:{" "}
            <span className="font-bold">
              <LocalClock timeZone={profile.timezone} label={profile.timezoneLabel} />
            </span>
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
          © 2026 {profile.name}. {profile.role}.
        </p>
        <a href="#top" className="underline-offset-4 hover:underline">
          Back to top
        </a>
      </footer>
    </section>
  );
}
