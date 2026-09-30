import type { Metadata } from "next";
import { Iris } from "@/features/iris/iris";
export const metadata: Metadata = {
  title: "Iris — Cartographie du SI",
  description:
    "Cartographiez vos services, zones et flux. Un projet portable, sans compte ni base de données.",
};
export default function IrisPage() {
  return <Iris />;
}
