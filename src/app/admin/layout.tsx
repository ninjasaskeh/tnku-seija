import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Layout area admin: polos, gelap, tanpa efek panggung 3D halaman utama. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-ink text-small text-paper">{children}</div>;
}
