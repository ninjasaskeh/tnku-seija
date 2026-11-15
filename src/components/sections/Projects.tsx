"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectThumb } from "@/components/ProjectThumb";
import { Scramble } from "@/components/fx/Scramble";
import { projects } from "@/data/projects";
import { gsap, MOTION_OK, RAIL, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { lenisRef } from "@/lib/lenis";
import { setProject } from "@/lib/stage";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Projects.
 * - Layar lebar ("staged"): layar di-pin, tiap scroll ganti satu project penuh.
 *   Kubus 3D di kanan atas nyusun ulang jadi nomor project yang aktif.
 * - Mobile / layar pendek / reduced motion: project ditumpuk biasa ke bawah.
 */
export function Projects() {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const n = projects.length;

  useGSAP(() => {
    const sec = section.current;
    const pinEl = pin.current;
    if (!sec || !pinEl) return;
    const mm = gsap.matchMedia();

    mm.add({ staged: RAIL, flow: `not all and ${RAIL}` }, (ctx) => {
      if (ctx.conditions?.staged) {
        sec.classList.add("is-staged");
        const st = ScrollTrigger.create({
          trigger: pinEl,
          start: "top top",
          end: () => `+=${window.innerHeight * 0.85 * (n - 1)}`,
          pin: true,
          refreshPriority: 1, // dihitung duluan, biar trigger lain di bawahnya dapet posisi yang bener
          onUpdate(self) {
            const i = Math.min(n - 1, Math.round(self.progress * (n - 1)));
            setActive((prev) => (prev === i ? prev : i));
          },
        });
        trigger.current = st;
        return () => {
          st.kill();
          trigger.current = null;
          sec.classList.remove("is-staged");
        };
      }

      // mode tumpuk: project yang lagi di tengah layar nentuin angka 3D
      const sts = gsap.utils.toArray<HTMLElement>("[data-slide]", sec).map((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 60%",
          onToggle: (self) => self.isActive && setActive(i),
        }),
      );
      return () => sts.forEach((s) => s.kill());
    });

    return () => mm.revert();
  });

  // project aktif ganti → kubus nyusun angka baru, slide masuk dengan wipe patah-patah
  useEffect(() => {
    setProject(active);
    const sec = section.current;
    if (!sec?.classList.contains("is-staged") || !window.matchMedia(MOTION_OK).matches) return;
    const slide = sec.querySelector<HTMLElement>(`[data-slide="${active}"]`);
    if (!slide) return;
    const tween = gsap.fromTo(
      slide,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "steps(8)", clearProps: "clipPath" },
    );
    return () => {
      tween.kill();
    };
  }, [active]);

  const jump = (i: number) => {
    const st = trigger.current;
    if (!st) return;
    const y = st.start + (i / (n - 1)) * (st.end - st.start);
    if (lenisRef.current) lenisRef.current.scrollTo(y);
    else window.scrollTo({ top: y });
  };

  return (
    <section
      ref={section}
      id="projects"
      data-chapter="projects"
      aria-labelledby="projects-title"
      className="group/sec relative pb-[45svh] pt-[22svh]"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 id="projects-title" className="cut display text-mega">
          <Scramble text="Projects" />
        </h2>
      </div>

      <div
        ref={pin}
        className="mx-auto mt-12 max-w-[1400px] px-5 sm:px-8 group-[.is-staged]/sec:mt-0 group-[.is-staged]/sec:flex group-[.is-staged]/sec:h-dvh group-[.is-staged]/sec:flex-col group-[.is-staged]/sec:pb-8 group-[.is-staged]/sec:pt-20"
      >
        <ol className="relative group-[.is-staged]/sec:flex-1">
          {projects.map((p, i) => (
            <li
              key={p.slug}
              data-slide={i}
              data-active={i === active}
              className="line-fg border-t py-12 group-[.is-staged]/sec:absolute group-[.is-staged]/sec:inset-0 group-[.is-staged]/sec:border-0 group-[.is-staged]/sec:py-0 group-[.is-staged]/sec:data-[active=false]:invisible"
            >
              <article className="group/card grid h-full gap-8 lg:grid-cols-12 lg:gap-10">
                <div className="panel flex flex-col justify-center lg:col-span-7">
                  <p className="text-small">
                    <span className="text-accent font-bold">{pad(i + 1)}</span>
                    <span className="text-dim">
                      {" "}
                      / {pad(n)} — {p.year}, {p.role}
                    </span>
                  </p>
                  <h3 className="display mt-4 text-[clamp(2.25rem,6.2vw,6.5rem)]">{p.title}</h3>
                  <p className="text-dim mt-5 max-w-[48ch] text-lead">{p.description}</p>
                  <ul aria-label="Stack" className="mt-6 flex flex-wrap gap-2">
                    {p.stack.map((s) => (
                      <li key={s} className="line-fg border px-2 py-0.5 text-small">
                        {s}
                      </li>
                    ))}
                  </ul>
                  {(p.links.live || p.links.repo) && (
                    <p className="mt-8 flex gap-6 font-bold">
                      {p.links.live && (
                        <a href={p.links.live} data-cursor="OPEN" className="text-accent underline underline-offset-4">
                          Open live site<span className="sr-only">: {p.title}</span>
                        </a>
                      )}
                      {p.links.repo && (
                        <a href={p.links.repo} data-cursor="CODE" className="text-accent underline underline-offset-4">
                          View code<span className="sr-only">: {p.title}</span>
                        </a>
                      )}
                    </p>
                  )}
                </div>

                {/* angka 3D nongkrong di kanan atas, thumbnail di kanan bawah */}
                <div className="flex items-end justify-end lg:col-span-5 xl:pr-24">
                  <div className="line-fg w-full max-w-[440px] border lg:rotate-2">
                    <ProjectThumb project={p} index={i} className="aspect-[16/10]" />
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>

        {/* indeks project: cuma di mode staged */}
        <nav aria-label="Projects" className="mt-6 hidden group-[.is-staged]/sec:block">
          <ul className="panel line-fg flex border-t">
            {projects.map((p, i) => (
              <li key={p.slug} className="flex-1">
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={i === active ? "true" : undefined}
                  className="line-fg text-dim w-full border-t-2 border-transparent py-3 text-left text-small hover:text-(--stage-fg) aria-[current]:border-(--stage-light) aria-[current]:text-(--stage-fg)"
                >
                  <span className="font-bold">{pad(i + 1)}</span> {p.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
