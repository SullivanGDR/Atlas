import { describe, expect, it } from "vitest";
import { tools } from "./tools";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
describe("tool registration contract", () => {
  it("provides unique routes and IDs", () => {
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.href)).size).toBe(tools.length);
  });
  it("links every tool to an implemented page", () => {
    for (const tool of tools) {
      expect(tool.href).toBe(`/tools/${tool.id}`);
      expect(
        existsSync(resolve("apps/web/app", tool.href.slice(1), "page.tsx")),
      ).toBe(true);
    }
  });
});
