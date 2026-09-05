import type { ToolDefinition } from "@atlas/shared";
export const tools = [
  {
    id: "schematic",
    name: "Schematic",
    description:
      "Dessinez vos données. Créez vos tables, reliez vos idées et emportez votre schéma partout.",
    href: "/tools/schematic",
    status: "available",
  },
] as const satisfies readonly ToolDefinition[];
