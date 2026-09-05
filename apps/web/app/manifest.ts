import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atlas",
    short_name: "Atlas",
    description:
      "Vos outils de conception et de développement au même endroit.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#191b1f",
    theme_color: "#191b1f",
    icons: [
      {
        src: "/brand/atlas-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/atlas-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
