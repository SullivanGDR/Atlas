import { describe, expect, it } from "vitest";
import {
  absolutePosition,
  arrange,
  exampleProject,
  groupAtDrop,
  parseProject,
  removeNode,
  reparent,
  serializeProject,
} from "./model";
import { renderSvg } from "./export";
import { useIris } from "./store";

describe("Iris — projets portables et zones", () => {
  it("roundtrips the project and rejects another tool, cycles and dangling links", () => {
    const p = exampleProject();
    expect(parseProject(JSON.parse(serializeProject(p)))).toEqual(p);
    expect(() =>
      parseProject({ format: "athena", version: 1, project: p }),
    ).toThrow();
    p.nodes[0]!.parentId = "platform";
    expect(() => serializeProject(p)).toThrow();
    delete p.nodes[0]!.parentId;
    p.links[0]!.target = "missing";
    expect(() => serializeProject(p)).toThrow();
  });
  it("moves a zone with its services and dissolves it without deleting links", () => {
    const p = exampleProject();
    const web = p.nodes.find((n) => n.id === "web")!;
    p.nodes[0]!.position.x += 100;
    expect(absolutePosition(web, p.nodes)).toEqual({ x: 132, y: 80 });
    removeNode(p, "platform");
    expect(web.parentId).toBeUndefined();
    expect(web.position).toEqual({ x: 132, y: 80 });
    expect(p.links).toHaveLength(5);
  });
  it("groups by full containment and releases a service moved outside", () => {
    const p = exampleProject();
    const web = p.nodes.find((n) => n.id === "web")!;
    groupAtDrop(p, web.id);
    expect(web.parentId).toBe("platform");
    web.position = { x: -500, y: 80 };
    groupAtDrop(p, web.id);
    expect(web.parentId).toBeUndefined();
    expect(web.position).toEqual({ x: -500, y: 80 });
  });
  it("rejects nested cycles and keeps organized children within their zones", () => {
    const p = exampleProject();
    reparent(p, "data", "platform");
    expect(() => reparent(p, "platform", "data")).toThrow();
    arrange(p);
    for (const n of p.nodes) {
      if (!n.parentId) continue;
      const parent = p.nodes.find((x) => x.id === n.parentId)!;
      expect(n.position.x + n.width).toBeLessThan(parent.width);
      expect(n.position.y + n.height).toBeLessThan(parent.height);
    }
    expect(() => serializeProject(p)).not.toThrow();
  });
  it("undoes an edit and restores it without losing project geometry", () => {
    useIris.getState().replace(exampleProject());
    const initial = structuredClone(useIris.getState().project);
    useIris.getState().edit(arrange);
    const arranged = structuredClone(useIris.getState().project);
    useIris.getState().undo();
    expect(useIris.getState().project).toEqual(initial);
    useIris.getState().redo();
    expect(useIris.getState().project).toEqual(arranged);
  });
  it("renders escaped vector text, local embedded logos and grouped positions", () => {
    const p = exampleProject();
    p.name = '<script>alert("x")</script>';
    p.nodes[0]!.position.x = -1000;
    const { svg, width } = renderSvg(p, {
      postgresql: "data:image/svg+xml;base64,PHN2Zy8+",
    });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("data:image/svg+xml;base64,");
    expect(svg).toContain("Made on Atlas by Iris");
    expect(width).toBeGreaterThan(1900);
  });
});
