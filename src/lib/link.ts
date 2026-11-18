/**
 * Atribut buat link luar (http/https): buka di tab baru, tanpa akses balik ke halaman ini (noopener)
 * dan tanpa bocorin URL asal (noreferrer). mailto:, "#", dan path lokal tetap di tab yang sama.
 * Pake: <a href={href} {...newTab(href)}>
 */
export const newTab = (href: string) =>
  /^https?:\/\//i.test(href) ? ({ target: "_blank", rel: "noopener noreferrer" } as const) : {};
