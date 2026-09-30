import type { ToolDefinition } from "@atlas/shared";
export const tools = [
  {
    id: "metis",
    name: "Métis",
    description:
      "Transformez vos intentions en consignes claires. Composez des prompts structurés, prêts à copier dans votre assistant.",
    href: "/tools/metis",
    status: "available",
  },
  {
    id: "themis",
    name: "Thémis",
    description:
      "Cadrez vos projets. Rédigez un cahier des charges structuré, des premières intentions aux critères de recette.",
    href: "/tools/themis",
    status: "available",
  },
  {
    id: "iris",
    name: "Iris",
    description:
      "Cartographiez votre SI. Regroupez vos services et rendez leurs connexions lisibles.",
    href: "/tools/iris",
    status: "available",
  },
  {
    id: "athena",
    name: "Athena",
    description:
      "Dessinez vos données. Créez vos tables, reliez vos idées et emportez votre schéma partout.",
    href: "/tools/athena",
    status: "available",
  },
] as const satisfies readonly ToolDefinition[];
