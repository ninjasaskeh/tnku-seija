import { BootScreen } from "@/components/fx/BootScreen";
import { ChapterHud } from "@/components/fx/ChapterHud";
import { Cursor } from "@/components/fx/Cursor";
import { ScrollHud } from "@/components/fx/ScrollHud";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { StageDirector } from "@/components/fx/StageDirector";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Stage } from "@/components/three/Stage";

/**
 * Susunan halaman:
 * - Stage      : scene 3D layar penuh di belakang semua konten
 * - Director   : ganti bentuk kubus + warna halaman tiap pindah bab
 * - 5 bab      : Hero, About, Projects, Skills, Contact (tiap bab punya data-chapter)
 */
export default function Home() {
  return (
    <>
      <noscript>
        <style>{`.boot{display:none}`}</style>
      </noscript>
      <Stage />
      <BootScreen />
      <SmoothScroll />
      <StageDirector />
      <Cursor />
      <ScrollHud />
      <ChapterHud />
      <a
        href="#main"
        className="bg-accent sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Contact />
      </main>
    </>
  );
}
