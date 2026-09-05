import { beforeEach, describe, expect, it } from "vitest";
import { exampleSchema, parseProject, serializeProject } from "./schema";
import { useEditor } from "../store/editor";
beforeEach(() => useEditor.getState().replace(exampleSchema()));
describe("portable projects", () => {
  it("round-trips tables, positions, columns and relations without loss", () => {
    const schema = exampleSchema();
    expect(parseProject(JSON.parse(serializeProject(schema)))).toEqual(schema);
  });
  it("rejects unknown versions and dangling links", () => {
    const value = JSON.parse(serializeProject(exampleSchema()));
    value.version = 99;
    expect(() => parseProject(value)).toThrow();
    value.version = 1;
    value.schema.entities.pop();
    expect(() => parseProject(value)).toThrow();
  });
  it("cleans up references when deleting a column or table", () => {
    useEditor.getState().removeColumn("projects", "owner-id");
    expect(useEditor.getState().schema.relations).toHaveLength(0);
    useEditor.getState().replace(exampleSchema());
    useEditor.getState().removeTable("users");
    expect(useEditor.getState().schema.relations).toHaveLength(0);
    expect(() => serializeProject(useEditor.getState().schema)).not.toThrow();
  });
  it("propagates key types without mutating a previous snapshot", () => {
    const before = useEditor.getState().schema;
    useEditor.getState().patchColumn("users", "user-id", { type: "SERIAL" });
    expect(before.entities[1]?.attributes[1]?.type).toBe("UUID");
    expect(useEditor.getState().schema.entities[1]?.attributes[1]?.type).toBe(
      "INTEGER",
    );
    expect(() => serializeProject(useEditor.getState().schema)).not.toThrow();
  });
  it("rejects a duplicate link and keeps referenced keys primary", () => {
    const existing = exampleSchema().relations[0]!;
    useEditor.getState().connect(existing);
    expect(useEditor.getState().schema.relations).toHaveLength(1);
    useEditor
      .getState()
      .patchColumn("users", "user-id", { isPrimaryKey: false });
    expect(
      useEditor.getState().schema.entities[0]?.attributes[0]?.isPrimaryKey,
    ).toBe(true);
  });
});
