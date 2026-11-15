"use client";

import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";

/** About: kata-kata paragraf pembuka "nyala" seiring scroll, baris fakta masuk berurutan. */
export function AboutFx() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const lead = document.querySelector<HTMLElement>("[data-about-lead]");
      if (!lead) return;
      const split = SplitText.create(lead, { type: "words", aria: "auto" });
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
      gsap.from("#about [data-fact]", {
        x: -24,
        autoAlpha: 0,
        duration: 0.35,
        ease: "steps(4)",
        stagger: 0.08,
        scrollTrigger: { trigger: "#about dl", start: "top 85%", once: true },
      });
      return () => split.revert();
    });
    return () => mm.revert();
  });
  return null;
}
