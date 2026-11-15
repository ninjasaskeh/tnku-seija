import { Crosshair } from "@/components/deco/Crosshair";
import { PixelGlyph, type GlyphName } from "@/components/deco/PixelGlyph";

const colors = [
  { name: "acid", hex: "#C6FF00", cls: "bg-acid", use: "Aksen utama, teks di atas hitam" },
  { name: "ink", hex: "#000000", cls: "bg-ink", use: "Latar utama" },
  { name: "paper", hex: "#FFFFFF", cls: "bg-paper", use: "Teks utama" },
  { name: "volt", hex: "#3B2BFF", cls: "bg-volt", use: "Bidang saja, teksnya putih" },
  { name: "violet", hex: "#B18CFF", cls: "bg-violet", use: "Aksen kecil, label" },
  { name: "ash", hex: "#9A9A9A", cls: "bg-ash", use: "Teks sekunder" },
];

const glyphs: GlyphName[] = ["arrow", "plus", "skull", "stair", "check", "frame"];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="mb-6 text-small text-acid">{title}</h2>
      {children}
    </section>
  );
}

export default function Styleguide() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <header className="py-12">
        <p className="text-small text-ash">/styleguide — tahap 1</p>
        <h1 className="display text-stack mt-4 text-h1">Tokens</h1>
      </header>

      <Block title="Warna">
        <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
          {colors.map((c) => (
            <li key={c.name} className="bg-ink">
              <div className={`${c.cls} h-28 border border-line`} />
              <div className="p-3">
                <p className="font-bold">{c.name}</p>
                <p className="text-small text-ash">{c.hex}</p>
                <p className="mt-2 text-small">{c.use}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-px sm:grid-cols-3">
          <p className="bg-ink p-4 text-acid ring-1 ring-line">Acid di atas hitam — 17.6:1</p>
          <p className="bg-volt p-4 text-paper">Putih di atas volt — 7.1:1</p>
          <p className="bg-acid p-4 text-ink">Hitam di atas acid — 17.6:1</p>
        </div>
      </Block>

      <Block title="Tipografi">
        <div className="space-y-8">
          <div>
            <p className="display text-h1">Aa 0123</p>
            <p className="mt-2 text-small text-ash">display / h1 — Archivo 900, lebar 125%</p>
          </div>
          <div>
            <p className="display text-h2">Selected projects</p>
            <p className="mt-2 text-small text-ash">display / h2</p>
          </div>
          <div>
            <p className="display text-h3">Data card title</p>
            <p className="mt-2 text-small text-ash">display / h3</p>
          </div>
          <div className="max-w-[62ch]">
            <p className="text-lead">
              Lead 20px — paragraf pembuka section, Space Mono regular.
            </p>
            <p className="mt-4">
              Body 16px — teks baca selalu putih polos di atas hitam, tanpa efek. Semua
              glitch, dither, dan tumpukan cuma boleh ada di layer dekorasi di belakang
              atau di samping konten.
            </p>
            <p className="mt-4 text-small text-ash">Small 13px — meta dan caption.</p>
            <p className="mt-2 text-micro text-violet">MICRO 11PX — X:0482 Y:0117 / 0xC6FF00</p>
          </div>
        </div>
      </Block>

      <Block title="Dekorasi">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="hazard h-10" />
            <div className="hazard-volt mt-3 h-10" />
            <p className="mt-2 text-small text-ash">hazard / hazard-volt</p>
          </div>
          <div>
            <div className="grid-px"><div className="corners flex h-[92px] items-center justify-center gap-8">
              <Crosshair />
              <Crosshair size={24} className="text-paper" />
              <Crosshair size={56} className="text-violet" />
            </div></div>
            <p className="mt-2 text-small text-ash">corners + grid-px + Crosshair</p>
          </div>
          <div>
            <div className="flex flex-wrap items-end gap-6">
              {glyphs.map((g) => (
                <PixelGlyph key={g} name={g} />
              ))}
              <PixelGlyph name="skull" size={12} className="text-paper" />
              <PixelGlyph name="frame" size={12} className="text-volt" />
            </div>
            <p className="mt-2 text-small text-ash">PixelGlyph</p>
          </div>
          <div>
            <div className="border border-line p-4 text-small">
              <p className="text-ash">$ boot --profile portfolio</p>
              <p>
                [<span className="text-acid"> OK </span>] tokens loaded
              </p>
              <p>
                [<span className="text-acid"> OK </span>] fonts mounted
              </p>
              <p>
                [<span className="text-violet">WAIT</span>] renderer
                <span className="ml-1 inline-block h-[1em] w-[0.6em] translate-y-[2px] bg-acid" />
              </p>
            </div>
            <p className="mt-2 text-small text-ash">teks terminal</p>
          </div>
          <div className="relative md:col-span-2">
            <div className="relative overflow-hidden bg-volt p-8">
              <p className="display text-stack text-h2">Stacked text</p>
              <div className="scanlines absolute inset-0" />
            </div>
            <p className="mt-2 text-small text-ash">text-stack + scanlines di atas volt</p>
          </div>
        </div>
      </Block>
    </main>
  );
}
