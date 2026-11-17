import { BootScreen } from "@/components/fx/BootScreen";
import { CircuitTrace } from "@/components/fx/CircuitTrace";
import { PingField } from "@/components/fx/PingField";
import { Cursor } from "@/components/fx/Cursor";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { StageDirector } from "@/components/fx/StageDirector";
import { TabPresence } from "@/components/fx/TabPresence";
import { TraceHud } from "@/components/fx/TraceHud";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Stage } from "@/components/three/Stage";

/**
 * KONSEP: ROUND TRIP — pengunjung = satu HTTP request yang nembus seluruh stack.
 * Susunan halaman:
 * - Stage      : scene 3D layar penuh di belakang semua konten
 * - Director   : ganti bentuk kubus + warna halaman tiap pindah bab (hop)
 * - TraceHud   : waterfall ms + RTT asli (kanan bawah)
 * - CircuitTrace : jalur PCB yang nyambungin semua hop, paket nyala ngikutin scroll
 * - TabPresence  : judul tab + favicon ikut status request
 * - PingField    : klik area kosong = ping beneran
 * - 5 hop      : Request (Hero), Handshake (About), Routes (Projects), Query (Skills), Response (Contact)
 */
export default function Home() {
  return (
    <>
      <noscript>
        <style>{`.boot{display:none} [data-reasm] [data-c], #top [data-in]{visibility:visible !important}`}</style>
      </noscript>
      <Stage />
      <BootScreen />
      <SmoothScroll />
      <StageDirector />
      <Cursor />
      <TraceHud />
      <TabPresence />
      <PingField />
      <a
        href="#main"
        className="bg-accent sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="relative">
        <CircuitTrace />
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Contact />
      </main>
    </>
  );
}
