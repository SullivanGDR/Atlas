import type { Metadata } from "next";
import { Hestia } from "@/features/hestia/hestia";

export const metadata: Metadata = {
  title: "Hestia — Design system",
  description:
    "Construisez une base visuelle cohérente avec des palettes, des tokens et des composants accessibles.",
};

export default function Page() {
  return <Hestia />;
}
