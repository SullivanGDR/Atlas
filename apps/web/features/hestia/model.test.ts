import { describe, expect, it } from "vitest";
import {
  contrastAudit,
  contrastRatio,
  createProject,
  exportCss,
  parseProject,
  serializeProject,
  tokens,
} from "./model";

describe("Hestia", () => {
  it("creates a readable default palette", () => {
    const project = createProject();
    const audit = contrastAudit(project);
    expect(audit).toHaveLength(3);
    expect(audit.every((pair) => pair.pass)).toBe(true);
    expect(contrastRatio("#ffffff", "#000000")).toBe(21);
  });

  it("keeps semantic tokens coherent between themes", () => {
    const project = createProject();
    const light = tokens(project, "light");
    const dark = tokens(project, "dark");
    expect(light.brand).toBe(project.customAccent);
    expect(dark.background).not.toBe(light.background);
    expect(dark.brandForeground).toMatch(/^#/);
  });

  it("round-trips a portable project and exports CSS tokens", () => {
    const project = createProject();
    project.name = "Site Atlas";
    project.radius = 12;
    project.scale = "airy";
    const parsed = parseProject(JSON.parse(serializeProject(project)));
    expect(parsed).toEqual(project);
    const css = exportCss(project);
    expect(css).toContain("--brand:");
    expect(css).toContain("--radius: 12px");
    expect(css).toContain('[data-theme="dark"]');
  });

  it("rejects another Atlas tool format", () => {
    expect(() =>
      parseProject({ format: "atlas-metis", version: 2, project: {} }),
    ).toThrow();
  });
});
