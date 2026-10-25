import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_NAME, THEME_COLOR } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: "Spending",
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#eef1f5",
    theme_color: THEME_COLOR,
    icons: [
      {
        src: "/brand/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
