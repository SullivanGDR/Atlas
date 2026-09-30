import { describe, it, expect } from "vitest";
import { exampleSchema } from "../model/schema";
import {
  projectDiagram,
  renderDiagramImage,
  diagramImageBlob,
} from "./diagram-image";

const palette = {
  paper: "#ffffff",
  ink: "#292929",
  muted: "#666666",
  line: "#d5d5d5",
  header: "#f5f5f5",
};

describe("image exports", () => {
  it("exports a white standalone vector document with escaped title and real column types", async () => {
    const schema = exampleSchema();
    schema.name = 'Étude <script> & "Clients"';
    const output = renderDiagramImage(schema, "erd", palette);
    expect(output.svg).toContain(
      "ERD — Étude &lt;script&gt; &amp; &quot;Clients&quot;",
    );
    expect(output.svg).toContain('fill="#ffffff"');
    expect(output.svg).toContain(">VARCHAR</text>");
    expect(output.svg).toContain(">TIMESTAMP</text>");
    expect(output.svg).toContain("Made on Atlas by Athena");
    expect(output.svg).not.toMatch(/<script|foreignObject|<input|<select/g);
    const blob = await diagramImageBlob(output, "svg");
    expect(await blob.text()).toBe(output.svg);
    expect(blob.type).toContain("image/svg+xml");
  });
  it("projects conceptual attributes and logical join tables without changing the project", () => {
    const schema = exampleSchema();
    const before = structuredClone(schema);
    const mcd = projectDiagram(schema, "mcd");
    expect(mcd.entities[1]!.attributes.map((a) => a.name)).not.toContain(
      "owner_id",
    );
    expect(mcd.entities[1]!.attributes.some((a) => a.isPrimaryKey)).toBe(true);
    expect(renderDiagramImage(schema, "mcd", palette).svg).not.toContain(
      ">UUID</text>",
    );
    expect(schema).toEqual(before);
    schema.relations[0]!.cardinality = "N-N";
    schema.relations[0]!.targetColumnId = "project-id";
    const logical = projectDiagram(schema, "mld");
    expect(logical.entities).toHaveLength(3);
    expect(
      logical.entities[2]!.attributes.filter((a) => a.isPrimaryKey),
    ).toHaveLength(2);
    expect(renderDiagramImage(schema, "mld", palette).tableCount).toBe(3);
  });
  it("centers all content including self-relations and ignores viewport coordinates", () => {
    const schema = exampleSchema();
    schema.relations.push({
      id: "self",
      sourceEntityId: "projects",
      targetEntityId: "projects",
      sourceColumnId: "project-id",
      targetColumnId: "owner-id",
      cardinality: "1-N",
      name: "Association avec un nom très long",
    });
    const output = renderDiagramImage(schema, "erd", palette);
    const { x, y, width, height } = output.contentBounds;
    expect(x).toBeCloseTo((output.width - width) / 2);
    expect(x).toBeGreaterThanOrEqual(64);
    expect(y).toBeGreaterThan(108);
    expect(y + height).toBeLessThan(output.height - 64);
    schema.entities.forEach((e) => {
      e.position = { x: -10000, y: 20000 };
    });
    expect(renderDiagramImage(schema, "erd", palette).svg).toBe(output.svg);
  });
  it("includes tall tables and rejects empty diagrams explicitly", () => {
    const schema = exampleSchema();
    schema.entities[0]!.attributes = Array.from({ length: 80 }, (_, i) => ({
      ...schema.entities[0]!.attributes[0]!,
      id: "col" + i,
      name: "column_" + i,
    }));
    const output = renderDiagramImage(schema, "erd", palette);
    expect(output.svg).toContain("column_79");
    expect(output.height).toBeGreaterThan(3000);
    expect(() =>
      renderDiagramImage(
        { ...schema, entities: [], relations: [] },
        "erd",
        palette,
      ),
    ).toThrow("Ajoutez une table");
  });
});
