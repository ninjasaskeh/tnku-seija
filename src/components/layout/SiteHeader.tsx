import { PixelGlyph } from "@/components/deco/PixelGlyph";
import { nav, profile } from "@/data/profile";

/** Header nempel di atas. Stripnya transparan; cuma nama + menu yang punya latar, biar scene 3D tetep keliatan. */
export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div className="flex h-14 items-center justify-between gap-4 px-3 sm:px-6">
        <a href="#top" className="panel pointer-events-auto flex items-center gap-3 px-2 py-1 font-bold">
          <PixelGlyph name="frame" size={4} className="text-current" />
          <span className="max-sm:sr-only">{profile.name}</span>
        </a>
        <nav aria-label="Main" className="panel pointer-events-auto px-2 py-1">
          <ul className="flex gap-4 text-small sm:gap-7">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="py-2 underline-offset-4 hover:underline">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
