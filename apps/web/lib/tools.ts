import type { ToolDefinition } from "@atlas/shared";
/** Add public tool metadata here. The shell renders this registry automatically. */
export const tools = [
  {
    id: "db-designer",
    name: "DB Designer",
    description:
      "Concevoir un MCD, préparer son MLD et générer un backend FastAPI + PostgreSQL.",
    href: "/tools/db-designer",
    status: "planned",
  },
] as const satisfies readonly ToolDefinition[];
