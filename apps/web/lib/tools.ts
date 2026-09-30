import type { ToolDefinition } from "@atlas/shared";
export const tools = [
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
