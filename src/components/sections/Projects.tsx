"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectThumb } from "@/components/ProjectThumb";
import { HopHeading } from "@/components/layout/Hop";
import { useContent } from "@/components/ContentProvider";
import type { Project } from "@/lib/content-types";
import { gsap, MOTION_OK, RAIL, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { lenisRef } from "@/lib/lenis";
import { newTab } from "@/lib/link";
import { setProject } from "@/lib/stage";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Hop 03 — Routes. Tiap project = satu endpoint API: request line + response JSON.
 * - Layar lebar ("staged"): layar di-pin, tiap scroll ganti satu route penuh.
 *   Kubus 3D di kanan atas nyusun ulang jadi nomor route yang aktif (/01, /02, ...).
 * - Mobile / layar pendek / reduced motion: project ditumpuk biasa ke bawah.
 */
export function Projects() {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const edge = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const prev = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const { projects } = useContent();
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
            // garis progres di indeks route ngikut scroll terus (halus), beda dengan slide yang ganti per langkah
            if (bar.current) gsap.set(bar.current, { scaleX: self.progress });
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

  // project aktif ganti → kubus nyusun angka baru + transisi "routing" antar slide:
  // slide lama & baru dipotong clip-path patah-patah di satu garis batas yang sama (garis "scan" bawa label route),
  // jadi kelihatan kayak satu sapuan. Isi slide geser halus beda kecepatan (parallax, data-px = faktor),
  // status "200 OK" di-scramble kayak response baru dateng, thumbnail kebuka dari atas.
  // Arah ngikut urutan: maju = sapuan dari kanan ke kiri, mundur = kebalikannya.
  useEffect(() => {
    setProject(active);
    const from = prev.current;
    prev.current = active;
    const sec = section.current;
    if (from === null || from === active) return;
    if (!sec?.classList.contains("is-staged") || !window.matchMedia(MOTION_OK).matches) return;
    const slide = sec.querySelector<HTMLElement>(`[data-slide="${active}"]`);
    const old = sec.querySelector<HTMLElement>(`[data-slide="${from}"]`);
    if (!slide || !old) return;

    const dir = active > from ? 1 : -1;
    const D = 0.6;
    const STEP = "steps(10)";
    const FULL = "inset(0% 0% 0% 0%)";
    // maju: yang lama kemakan dari kanan, yang baru kebuka dari kanan → batasnya sama-sama jalan ke kiri
    const oldEnd = dir > 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)";
    const newStart = dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
    const px = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>("[data-px]")];
    const f = (el: HTMLElement) => Number(el.dataset.px) || 1;
    const oldPx = px(old);
    const newPx = px(slide);
    const status = slide.querySelector("[data-status]");
    const scan = slide.querySelector("[data-scan]");
    const json = slide.querySelector("pre");
    const line = edge.current;

    // balikin semua gaya inline: dipanggil pas selesai, atau pas ganti route lagi sebelum selesai
    // (slide lama harus balik invisible lagi, kalau nggak screen reader ikut baca)
    const reset = () => {
      gsap.set([old, slide, ...oldPx, ...newPx, line, scan, json].filter(Boolean), {
        clearProps: "clipPath,visibility,pointerEvents,zIndex,transform,opacity",
      });
      if (status) status.textContent = "200 OK";
    };
    const tl = gsap.timeline({ onComplete: reset });
    tl.set(old, { visibility: "visible", pointerEvents: "none", zIndex: 0 })
      .set(slide, { zIndex: 1 })
      .fromTo(old, { clipPath: FULL }, { clipPath: oldEnd, duration: D, ease: STEP }, 0)
      .to(oldPx, { x: (_, el) => -dir * 50 * f(el), duration: D, ease: "power2.in" }, 0)
      .fromTo(slide, { clipPath: newStart }, { clipPath: FULL, duration: D, ease: STEP }, 0)
      .fromTo(newPx, { x: (_, el) => dir * 90 * f(el) }, { x: 0, duration: 1, ease: "expo.out" }, 0.04);
    if (line)
      tl.fromTo(
        line,
        { left: dir > 0 ? "100%" : "0%", autoAlpha: 1 },
        { left: dir > 0 ? "0%" : "100%", duration: D, ease: STEP },
        0,
      ).set(line, { autoAlpha: 0 });
    if (scan) tl.fromTo(scan, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: FULL, duration: 0.4, ease: "steps(6)" }, 0.3);
    if (json) tl.fromTo(json, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "steps(3)" }, 0.5);
    if (status)
      tl.fromTo(
        status,
        { autoAlpha: 1 },
        { scrambleText: { text: "200 OK", chars: "0123456789", revealDelay: 0.3, speed: 0.6 }, duration: 0.6 },
        0.15,
      );

    return () => {
      tl.kill();
      reset();
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
      className="group/sec relative pb-[40svh] pt-[18svh]"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <HopHeading id="projects" titleId="projects-title" />
        <p className="panel text-dim mt-4 max-w-[52ch]">
          Every project is a route on this server. Each one gets hit, handled, and answered below.
        </p>
      </div>

      <div
        ref={pin}
        className="mx-auto mt-12 max-w-[1400px] px-5 sm:px-8 group-[.is-staged]/sec:mt-0 group-[.is-staged]/sec:flex group-[.is-staged]/sec:h-dvh group-[.is-staged]/sec:flex-col group-[.is-staged]/sec:pb-8 group-[.is-staged]/sec:pt-20"
      >
        <ol className="relative group-[.is-staged]/sec:flex-1">
          {/* garis scan transisi + label route tujuan; cuma muncul selama sapuan (lihat efek di atas) */}
          <span
            ref={edge}
            aria-hidden="true"
            className="pointer-events-none invisible absolute inset-y-0 z-10 hidden w-0.5 -translate-x-1/2 bg-(--stage-fg) group-[.is-staged]/sec:block"
          >
            <span className="bg-accent absolute top-0 left-1.5 px-1.5 py-0.5 text-micro font-bold whitespace-nowrap text-(--stage-dark)">
              → /{pad(active + 1)}
            </span>
          </span>
          {projects.map((p, i) => (
            <li
              key={p.slug}
              data-slide={i}
              data-active={i === active}
              className="line-fg border-t py-12 group-[.is-staged]/sec:absolute group-[.is-staged]/sec:inset-0 group-[.is-staged]/sec:border-0 group-[.is-staged]/sec:py-0 group-[.is-staged]/sec:data-[active=false]:invisible"
            >
              <article className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
                <div className="panel flex flex-col justify-center lg:col-span-7">
                  <p data-px="0.6" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
                    <span className="method">GET</span>
                    <span className="font-bold">/projects/{p.slug}</span>
                    <span data-status className="text-accent">
                      200 OK
                    </span>
                    <span className="text-dim">
                      {latency(i)}ms · {pad(i + 1)}/{pad(n)}
                    </span>
                  </p>
                  <h3 data-px="1" className="display mt-5 text-[clamp(2.25rem,6.2vw,6.5rem)]">{p.title}</h3>
                  <p data-px="0.8" className="text-dim mt-5 max-w-[48ch] text-lead">{p.description}</p>
                  {(p.links.live || p.links.repo) && (
                    <p data-px="0.5" className="mt-8 flex flex-wrap gap-3 font-bold">
                      {p.links.live && (
                        <a
                          href={p.links.live}
                          {...newTab(p.links.live)}
                          data-cursor="OPEN"
                          className="bg-accent border border-(--stage-light) px-4 py-2 hover:bg-transparent hover:text-(--stage-fg)"
                        >
                          Open live site ↗<span className="sr-only">: {p.title}</span>
                        </a>
                      )}
                      {p.links.repo && (
                        <a
                          href={p.links.repo}
                          {...newTab(p.links.repo)}
                          data-cursor="CODE"
                          className="border border-current px-4 py-2 hover:bg-(--stage-fg) hover:text-(--stage-dark)"
                        >
                          View code<span className="sr-only">: {p.title}</span>
                        </a>
                      )}
                    </p>
                  )}
                </div>

                {/* nomor route 3D nongkrong di kanan atas, response body di kanan bawah */}
                <div className="flex items-end justify-end lg:col-span-5 xl:pr-24">
                  <div data-px="1.4" className="group/card panel line-fg w-full max-w-[440px] border text-small">
                    <p className="line-fg flex justify-between border-b px-3 py-1.5">
                      <span className="font-bold">Response</span>
                      <span className="text-dim">application/json</span>
                    </p>
                    <div data-scan>
                      <ProjectThumb project={p} index={i} className="aspect-[16/7]" />
                    </div>
                    <Json project={p} />
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>

        {/* indeks route: cuma di mode staged */}
        <nav aria-label="Projects" className="mt-6 hidden group-[.is-staged]/sec:block">
          <ul className="panel line-fg relative flex border-t">
            {/* progres scroll keseluruhan: nambah halus, bukan per langkah */}
            <span
              ref={bar}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-(--stage-fg)"
            />
            {projects.map((p, i) => (
              <li key={p.slug} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={i === active ? "true" : undefined}
                  className="line-fg text-dim w-full truncate border-t-2 border-transparent py-3 text-left text-small hover:text-(--stage-fg) aria-[current]:border-(--stage-light) aria-[current]:text-(--stage-fg)"
                >
                  <span className="font-bold">/{pad(i + 1)}</span> {p.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

/** Latensi palsu tapi stabil per route (dekorasi). */
const latency = (i: number) => 24 + ((i * 37) % 61);

/** Body JSON project, diwarnain kayak syntax highlight. Isinya sama dengan teks di kiri → aria-hidden. */
function Json({ project: p }: { project: Project }) {
  const items = p.stack.map((s) => `"${s}"`);
  // stack pendek tetap satu baris; kalau panjang, isinya turun ke blok sendiri (indent 4)
  // biar baris lanjutannya nggak balik ke bawah tulisan "stack"
  const inline = items.join(", ").length <= 24;
  return (
    <pre aria-hidden="true" className="overflow-x-auto px-3 py-2.5 leading-relaxed">
      {"{\n  "}
      <Key k="year" />: {p.year},{"\n  "}
      <Key k="role" />: <span className="whitespace-pre-wrap">&quot;{p.role}&quot;</span>,{"\n  "}
      <Key k="stack" />: [
      {inline ? (
        <>{items.join(", ")}]{"\n"}</>
      ) : (
        <>
          <span className="block whitespace-normal pl-[4ch]">
            {items.map((s, i) => (
              <span key={i}>
                <span className="whitespace-nowrap">
                  {s}
                  {i < items.length - 1 && ","}
                </span>{" "}
              </span>
            ))}
          </span>
          {"  ]\n"}
        </>
      )}
      {"}"}
    </pre>
  );
}

const Key = ({ k }: { k: string }) => <span className="text-accent">&quot;{k}&quot;</span>;
