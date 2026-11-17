import { Home } from "@/components/Home";
import { getContent } from "@/lib/content";

/** Halaman utama: konten dari database (di-cache, tag "content"), dirender oleh <Home>. */
export default async function Page() {
  const content = await getContent();
  return <Home content={content} />;
}
