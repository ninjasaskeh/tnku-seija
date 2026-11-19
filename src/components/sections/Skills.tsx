import { SkillQuery } from "@/components/fx/SkillQuery";
import { HopHeading } from "@/components/layout/Hop";
import type { SkillGroup } from "@/lib/content-types";

/**
 * Hop 05 — Query. Request udah sampai database: skill = isi tabel `skills`.
 * Tabelnya bisa difilter (WHERE layer IN ...). Database 3D muter di kanan.
 */
export function Skills({ skills }: { skills: SkillGroup[] }) {
  const total = skills.reduce((n, s) => n + s.items.length, 0);
  return (
    <section
      id="skills"
      data-chapter="skills"
      aria-labelledby="skills-title"
      className="relative px-5 pb-[40svh] pt-[18svh] sm:px-8"
    >
      <div className="mx-auto max-w-[1400px]">
        <HopHeading id="skills" titleId="skills-title" />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="panel text-dim mb-6 max-w-[52ch]">
              Deepest hop. {total} rows across {skills.length} layers: the tools the request touched to get here.
              Filter the query to narrow it down.
            </p>
            <SkillQuery skills={skills} />
          </div>
        </div>
      </div>
    </section>
  );
}
