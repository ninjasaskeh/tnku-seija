import { PixelGlyph } from "@/components/deco/PixelGlyph";
import { Scramble } from "@/components/fx/Scramble";
import { StickerPlayground } from "@/components/fx/StickerPlayground";
import { skills } from "@/data/profile";
import { SkillsFx } from "./SkillsFx";

/**
 * Skills: bukan daftar kecil, tapi baris-baris huruf raksasa yang lewat di depan objek 3D.
 * Barisnya pake `cut`, jadi pas numpuk di atas kubus warnanya kebalik dan tetep kebaca.
 */
export function Skills() {
  return (
    <section
      id="skills"
      data-chapter="skills"
      aria-labelledby="skills-title"
      className="relative overflow-x-clip pb-[45svh] pt-[22svh]"
    >
      <SkillsFx />
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 id="skills-title" className="cut display text-mega">
          <Scramble text="Skills" />
        </h2>
      </div>

      <div className="mt-14 space-y-10 lg:space-y-6">
        {skills.map((s) => (
          <div key={s.group}>
            <h3 className="panel mx-5 inline-block px-1 text-small font-bold sm:mx-8">{s.group}</h3>
            <ul
              data-row
              className="cut display mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 px-5 text-h3 sm:px-8 lg:w-max lg:flex-nowrap lg:gap-x-8 lg:whitespace-nowrap lg:text-h2"
            >
              {s.items.map((item, i) => (
                <li key={item} className="flex items-center gap-x-5 lg:gap-x-8">
                  {i > 0 && <PixelGlyph name="plus" size={5} className="text-current max-lg:hidden" />}
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <StickerPlayground labels={skills.flatMap((s) => s.items)} />
      </div>
    </section>
  );
}
