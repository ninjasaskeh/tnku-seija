"use client";

import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Handshake: tiga langkah SYN / SYN-ACK / ACK masuk satu-satu,
 * kata-kata bio "nyala" seiring scroll, baris sertifikat ke-print berurutan.
 */
export function AboutFx() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray<HTMLElement>("#about [data-step]").forEach((step, i) => {
        // masuk dari arah pengirim: SYN/ACK (client) dari kiri, SYN-ACK (server) dari kanan.
        // Pake clip-path, bukan geser x, biar nggak bikin halaman melebar di HP.
        gsap.from(step, {
          clipPath: i % 2 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
          clearProps: "clipPath",
          duration: 0.4,
          ease: "steps(5)",
          scrollTrigger: { trigger: step, start: "top 85%", once: true },
        });
      });

      const lead = document.querySelector<HTMLElement>("[data-about-lead]");
      const split = lead ? SplitText.create(lead, { type: "words", aria: "auto" }) : null;
      if (lead && split) {
        gsap.fromTo(
          split.words,
          { opacity: 0.22 },
          {
            opacity: 1,
            stagger: 0.08,
            ease: "none",
            scrollTrigger: { trigger: lead, start: "top 82%", end: "bottom 45%", scrub: true },
          },
        );
      }

      gsap.from("#about [data-fact]", {
        clipPath: "inset(0 100% 0 0)",
        duration: 0.3,
        ease: "steps(6)",
        stagger: 0.09,
        clearProps: "clipPath",
        scrollTrigger: { trigger: "#about figure", start: "top 80%", once: true },
      });
      return () => split?.revert();
    });
    return () => mm.revert();
  });
  return null;
}
