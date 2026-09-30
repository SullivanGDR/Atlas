import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  catalog,
  catalogGroups,
  categories,
  serviceDefinition,
} from "./catalog";
import { exampleProject, parseProject, serializeProject } from "./model";

describe("Iris — catalogue de technologies", () => {
  it("keeps unique identifiers, grouped entries and self-contained SVG assets", () => {
    expect(new Set(catalog.map((s) => s.id)).size).toBe(catalog.length);
    expect(catalogGroups().flatMap((g) => g.services)).toHaveLength(
      catalog.length,
    );
    for (const service of catalog) {
      expect(categories).toContain(service.category);
      if (!service.logo) continue;
      const svg = readFileSync(
        resolve("apps/web/public", service.logo.slice(1)),
        "utf8",
      );
      expect(svg).toContain("<svg");
      expect(svg).not.toMatch(
        /<script|<foreignObject|(?:href|src)=["']https?:|onload=/i,
      );
    }
  });
  it("searches technology aliases and accents, preserving old project IDs", () => {
    expect(catalogGroups("next js")[0]?.services[0]?.id).toBe("nextjs");
    expect(catalogGroups("nuxt")[0]?.services[0]?.id).toBe("nuxtjs");
    expect(catalogGroups("securite")[0]?.name).toBe("Sécurité");
    expect(catalogGroups("react", "Bases de données")).toEqual([]);
    expect(serviceDefinition("unknown").id).toBe("application");
    expect(
      parseProject(JSON.parse(serializeProject(exampleProject()))),
    ).toEqual(exampleProject());
  });
});
