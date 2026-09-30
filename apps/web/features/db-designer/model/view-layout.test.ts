import { describe, expect, it } from "vitest";
import { exampleSchema } from "./schema";
import { arrangeProjection, conceptualConnections } from "./view-layout";
import { projectDiagram } from "../generators/diagram-image";

describe("projected view layout", () => {
  it("arranges visible MCD rows without modifying editable positions or attributes", () => {
    const schema = exampleSchema();
    schema.entities.push({
      ...structuredClone(schema.entities[0]!),
      id: "third",
      position: { x: -200, y: 5000 },
    });
    const original = structuredClone(schema);
    const projected = projectDiagram(schema, "mcd");
    const arranged = arrangeProjection(projected);
    expect(arranged.entities.map((entity) => entity.position)).toEqual([
      { x: 0, y: 0 },
      { x: 480, y: 0 },
      { x: 0, y: 330 },
    ]);
    expect(arranged.entities[1]!.attributes).toHaveLength(3);
    expect(projected.entities[2]!.position).toEqual({ x: -200, y: 5000 });
    expect(schema).toEqual(original);
    expect(arrangeProjection({ ...schema, entities: [] }).entities).toEqual([]);
  });
  it("assigns distinct conceptual handles and routes vertical neighbors through facing sides", () => {
    const schema = exampleSchema();
    schema.entities.push({
      ...structuredClone(schema.entities[0]!),
      id: "third",
    });
    schema.relations.push({
      ...schema.relations[0]!,
      id: "second",
      sourceEntityId: "third",
    });
    const graph = arrangeProjection(projectDiagram(schema, "mcd"));
    const connections = conceptualConnections(graph);
    const targets = connections.ports.projects!;
    expect(targets).toHaveLength(2);
    expect(new Set(targets.map((port) => port.id)).size).toBe(2);
    expect(targets[0]!.offset).not.toBe(targets[1]!.offset);
    expect(
      targets.every(
        (port) => port.side === "left" && port.offset > 30 && port.offset < 100,
      ),
    ).toBe(true);
    graph.relations.push({
      ...schema.relations[0]!,
      id: "vertical",
      sourceEntityId: "users",
      targetEntityId: "third",
    });
    const vertical = conceptualConnections(graph);
    expect(
      vertical.ports.users!.find(
        (port) => port.id === vertical.handles.vertical!.source,
      )!.side,
    ).toBe("bottom");
    expect(
      vertical.ports.third!.find(
        (port) => port.id === vertical.handles.vertical!.target,
      )!.side,
    ).toBe("top");
  });
});
