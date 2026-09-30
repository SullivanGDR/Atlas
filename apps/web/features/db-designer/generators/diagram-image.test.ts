import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { exampleSchema } from "../model/schema";
import {
  projectDiagram,
  renderDiagramImage,
  diagramImageBlob,
} from "./diagram-image";

const palette = {
  paper: "#f0f0ef",
  ink: "#292929",
  muted: "#666666",
  line: "#d5d5d5",
  header: "#e6e6e4",
};

describe("image exports", () => {
  it("exports a standalone vector document with escaped title and real column types", async () => {
    const schema = exampleSchema();
    schema.name = 'Étude <script> & "Clients"';
    const output = renderDiagramImage(schema, "erd", palette);
    expect(output.svg).toContain(
      "ERD — Étude &lt;script&gt; &amp; &quot;Clients&quot;",
    );
    expect(output.svg).toContain('fill="#f0f0ef"');
    expect(output.svg).toContain(">VARCHAR</text>");
    expect(output.svg).toContain(">TIMESTAMP</text>");
    expect(output.svg).toContain("Made on Atlas by Athena");
    expect(output.svg).not.toMatch(/<script|foreignObject|<input|<select/g);
    const blob = await diagramImageBlob(output, "svg");
    expect(await blob.text()).toBe(output.svg);
    expect(blob.type).toContain("image/svg+xml");
  });
  it("shrinks MCD cards to visible fields while retaining columns and direct vertical links", () => {
    const schema = exampleSchema();
    schema.entities[1]!.attributes.find((a) => a.id === "title")!.type = "UUID";
    schema.entities.push({
      id: "third",
      name: "table_1",
      position: { x: 0, y: 400 },
      attributes: [
        {
          id: "third-id",
          name: "id",
          type: "UUID",
          isPrimaryKey: true,
          nullable: false,
        },
      ],
    });
    schema.relations.push({
      id: "third-project",
      sourceEntityId: "third",
      sourceColumnId: "third-id",
      targetEntityId: "projects",
      targetColumnId: "title",
      cardinality: "1-N",
    });
    schema.entities.push({
      id: "fourth",
      name: "table_2",
      position: { x: 600, y: 400 },
      attributes: [
        {
          id: "fourth-id",
          name: "id",
          type: "UUID",
          isPrimaryKey: true,
          nullable: false,
        },
      ],
    });
    schema.relations.push({
      id: "project-fourth",
      sourceEntityId: "projects",
      sourceColumnId: "project-id",
      targetEntityId: "fourth",
      targetColumnId: "fourth-id",
      cardinality: "1-N",
    });
    const mcd = renderDiagramImage(schema, "mcd", palette);
    const mld = renderDiagramImage(schema, "mld", palette);
    expect(mcd.layout.map(({ id, x }) => ({ id, x }))).toEqual(
      mld.layout.map(({ id, x }) => ({ id, x })),
    );
    expect(mcd.layout.find((table) => table.id === "projects")!.height).toBe(
      mld.layout.find((table) => table.id === "projects")!.height - 84,
    );
    expect(mcd.layout.find((table) => table.id === "users")!.height).toBe(
      mld.layout.find((table) => table.id === "users")!.height,
    );
    expect(mcd.height).toBe(mld.height);
    const routes = [
      ...mcd.svg.matchAll(/data-relation="[^"]+" d="([^"]+)"/g),
    ].map((match) => match[1]!);
    expect(routes).toHaveLength(3);
    expect(routes.slice(0, 2).every((route) => route.includes(" Q"))).toBe(
      true,
    );
    const vertical = routes[2]!.match(
      /^M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+)$/,
    )!;
    expect(vertical).not.toBeNull();
    expect(vertical[1]).toBe(vertical[3]);
    expect(Number(vertical[4])).toBeGreaterThan(Number(vertical[2]));
    expect(mcd.svg).not.toContain(">1 : N</text>");
    expect(mcd.svg).toContain(
      'font-size="17" font-family="monospace">email</text>',
    );
    expect(routes[0]!.split(" L").at(-1)).not.toBe(
      routes[1]!.split(" L").at(-1),
    );
    expect(mld.svg).toContain(">Clé primaire</text>");
    expect(mld.svg).toContain(">Clé étrangère</text>");
    expect(mld.svg).not.toContain("Clé primaire    FK");
    const directory = resolve("test-results/image-exports");
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, "mcd.svg"), mcd.svg);
    writeFileSync(resolve(directory, "mld.svg"), mld.svg);
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
