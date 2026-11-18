"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast, Toaster as Sonner, type ToasterProps } from "sonner";
import { FLASH_COOKIE } from "@/lib/flash";

/**
 * Toast admin, versi komponen `sonner` dari shadcn/ui tapi tanpa next-themes (admin selalu gelap)
 * dan pake gaya NOC: kotak, garis tipis, mono, ikon teks. Dipasang sekali di layout admin;
 * panggil `toast.success()` / `toast.error()` dari `sonner` di client component mana aja.
 */
export function Toaster(props: ToasterProps) {
  return (
    <>
      <Sonner
        theme="dark"
        position="bottom-right"
        gap={8}
        icons={{
          success: <span className="text-acid">✓</span>,
          error: <span className="text-violet">✕</span>,
          info: <span className="text-paper">i</span>,
          warning: <span className="text-violet">!</span>,
          loading: <span aria-hidden="true" className="block size-3 animate-spin border-2 border-acid border-t-transparent" />,
        }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex w-full items-start gap-3 border border-line border-l-2 bg-ink px-4 py-3 text-small text-paper shadow-[0_8px_24px_rgb(0_0_0/0.6)]",
            success: "border-l-acid",
            error: "border-l-violet",
            icon: "mt-px flex size-4 shrink-0 items-center justify-center font-bold",
            content: "min-w-0 flex-1",
            title: "font-bold",
            description: "mt-0.5 text-micro text-ash",
            actionButton: "shrink-0 bg-acid px-2.5 py-1 text-micro font-bold text-ink hover:bg-paper",
            cancelButton: "shrink-0 border border-line px-2.5 py-1 text-micro hover:border-acid hover:text-acid",
            closeButton: "border border-line bg-ink text-ash hover:text-paper",
          },
        }}
        {...props}
      />
      {/* setelah <Sonner> biar Toaster udah subscribe duluan. usePathname wajib di dalam <Suspense> (Cache Components) */}
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </>
  );
}

/** Tampilkan pesan dari flash cookie (diisi Server Action sebelum redirect), lalu hapus cookie-nya. */
function FlashToast() {
  const pathname = usePathname();
  useEffect(() => {
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${FLASH_COOKIE}=`));
    if (!raw) return;
    document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/admin`;
    const value = raw.slice(FLASH_COOKIE.length + 1);
    let message = value;
    try {
      message = decodeURIComponent(value);
    } catch {}
    if (message) toast.success(message);
  }, [pathname]);
  return null;
}
