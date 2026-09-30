import type { Metadata } from "next";
import { Themis } from "@/features/themis/themis";
export const metadata: Metadata = {
  title: "Thémis — Cahier des charges",
  description:
    "Rédigez un cahier des charges guidé, vérifiez vos exigences et exportez un document Word compatible avec Google Docs.",
};
export default function Page() {
  return <Themis />;
}
