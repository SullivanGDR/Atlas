import { describe, expect, it } from "vitest";
import {
  contrastAudit,
  contrastRatio,
  createProject,
  exportCss,
  parseProject,
  serializeProject,
  tokens,
  applyStyle,
  designValues,
  styles,
  palettes,
  colorRamp,
  harmonies,
  exportHtml,
  exportTokens,
} from "./model";

describe("Hestia", () => {
  it("creates a readable default palette", () => {
    const project = createProject();
    const audit = contrastAudit(project);
    expect(audit).toHaveLength(8);
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
  it("migrates version 1 and validates custom roles without silently accepting unknown palettes", () => {
    const p = createProject();
    const { style, overrides, ...legacy } = p;
    void style;
    void overrides;
    const migrated = parseProject({
      format: "atlas-hestia",
      version: 1,
      project: legacy,
    });
    expect(migrated.overrides).toEqual({ light: {}, dark: {} });
    expect(migrated.style).toBe("product");
    expect(JSON.parse(serializeProject(migrated)).version).toBe(2);
    expect(() =>
      parseProject({
        format: "atlas-hestia",
        version: 2,
        project: { ...p, palette: "unknown" },
      }),
    ).toThrow();
    expect(() =>
      parseProject({
        format: "atlas-hestia",
        version: 2,
        project: {
          ...p,
          overrides: { light: { brand: "red; background:url()" }, dark: {} },
        },
      }),
    ).toThrow();
  });
  it("preserves separate dark accents and custom theme roles through every export", () => {
    const p = createProject();
    p.customAccent = "#445566";
    p.darkAccent = "#aabbcc";
    p.overrides = {
      light: { background: "#112233", muted: "#334455" },
      dark: { surface: "#223344" },
    };
    const result = parseProject(JSON.parse(serializeProject(p)));
    expect(tokens(result, "light").background).toBe("#112233");
    expect(tokens(result, "dark").brand).toBe("#aabbcc");
    expect(tokens(result, "dark").surface).toBe("#223344");
    expect(exportCss(result)).toContain("--background: #112233");
    expect(JSON.parse(exportTokens(result)).themes.dark.surface).toBe(
      "#223344",
    );
    expect(exportHtml(result)).toContain("--brand: #aabbcc");
    p.overrides.light.muted = "#ffffff";
    expect(
      contrastAudit(p).find((i) => i.name === "Texte secondaire")!.pass,
    ).toBe(false);
  });
  it("applies five distinct directions and shares density and geometry with exports", () => {
    const p = createProject();
    const directions = styles.map((s) => applyStyle(p, s.id));
    expect(
      new Set(directions.map((d) => JSON.stringify(designValues(d)))).size,
    ).toBe(5);
    expect(designValues(directions[1]!).sans).toContain("Georgia");
    expect(designValues(directions[3]!).borderWidth).toBe(2);
    expect(exportCss(directions[3]!)).toContain("--border-width: 2px");
    const compact = designValues({ ...p, scale: "compact" });
    const airy = designValues({ ...p, scale: "airy" });
    expect(airy.text).toBeGreaterThan(compact.text);
    expect(airy.space).toBeGreaterThan(compact.space);
  });
  it("generates bounded color ramps and mathematical harmonies, and escapes HTML names", () => {
    const ramp = colorRamp("#ff0000");
    expect(ramp).toHaveLength(11);
    expect(ramp[5]!.color).toBe("#ff0000");
    const complementary = harmonies("#ff0000")[1]!;
    expect(complementary.colors).toEqual(["#ff0000", "#00ffff"]);
    const p = createProject();
    p.name = "<script>alert(1)</script>";
    expect(exportHtml(p)).not.toContain("<script>");
    expect(exportHtml(p)).toContain("&lt;script&gt;");
    expect(palettes).toHaveLength(12);
  });
});
