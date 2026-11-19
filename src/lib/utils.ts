/**
 * `cn` ala shadcn/ui, tapi cuma gabungin class (tanpa tailwind-merge): token kustom kayak
 * `text-micro` (ukuran) dan `text-accent` (warna) bisa dikira bentrok terus salah satunya dibuang.
 * Jadi class tambahan dari luar nambah, bukan nimpa; hindari ngirim utility yang bentrok.
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
