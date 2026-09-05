import type { Metadata } from "next";
import { Athena } from "@/features/db-designer/components/schematic";

export const metadata: Metadata = {
  title: "Athena",
  description:
    "Concevez vos tables et leurs relations dans un espace visuel. Vos projets restent à vous, dans des fichiers portables.",
};

export default function Page() {
  return <Athena />;
}
