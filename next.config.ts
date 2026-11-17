import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // URL admin lama → halaman baru
  async redirects() {
    return [
      { source: "/admin/content", destination: "/admin/profile", permanent: false },
      { source: "/admin/chats/:id", destination: "/admin/conversations/:id", permanent: false },
    ];
  },
  experimental: {
    // upload thumbnail project di /admin lewat Server Action (gambar maks 4 MB + data form)
    serverActions: { bodySizeLimit: "5mb" },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
