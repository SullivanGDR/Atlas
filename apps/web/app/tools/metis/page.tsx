import type { Metadata } from "next";
import { Metis } from "@/features/metis/metis";
export const metadata: Metadata = {
  title: "Métis — Atelier de prompts",
  description:
    "Composez des prompts clairs, structurés et portables, sans compte ni IA intégrée.",
};
export default function Page() {
  return <Metis />;
}
