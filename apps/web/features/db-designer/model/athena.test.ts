import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import {
  exampleSchema,
  parseProject,
  serializeProject,
  type Entity,
  type Schema,
  type Attribute,
} from "./schema";
import { useEditor } from "../store/editor";
import { mcdToMld } from "../transforms/mcd-to-mld";
import { generateFastAPI, zipProject } from "../generators/fastapi";
import { generateSQL } from "../generators/sql";
import { importSQL } from "./import-sql";
import { encodeShare, decodeShare } from "./share";

const col = (
  name: string,
  type: Attribute["type"] = "UUID",
  pk = false,
): Attribute => ({ id: name, name, type, isPrimaryKey: pk, nullable: false });
function blog(): Schema {
  const tables: Entity[] = [
    {
      id: "users",
      name: "users",
      position: { x: 0, y: 0 },
      attributes: [
        col("id", "UUID", true),
        { ...col("email", "VARCHAR"), unique: true, length: 120 },
      ],
    },
    {
      id: "posts",
      name: "posts",
      position: { x: 450, y: 0 },
      attributes: [
        col("id", "SERIAL", true),
        col("author_id"),
        col("title", "VARCHAR"),
        {
          ...col("created_at", "TIMESTAMP"),
          defaultValue: "CURRENT_TIMESTAMP",
        },
        { ...col("content", "TEXT"), nullable: true },
        {
          ...col("score", "NUMERIC"),
          precision: 8,
          scale: 2,
          defaultValue: "0",
        },
        { ...col("published", "BOOLEAN"), defaultValue: "false" },
        { ...col("payload", "JSONB"), defaultValue: "'{}'" },
      ],
    },
    {
      id: "tags",
      name: "tags",
      position: { x: 900, y: 0 },
      attributes: [
        col("id", "UUID", true),
        { ...col("label", "VARCHAR"), unique: true },
      ],
    },
    {
      id: "comments",
      name: "comments",
      position: { x: 450, y: 450 },
      attributes: [
        col("id", "BIGINT", true),
        col("post_id", "INTEGER"),
        col("body", "TEXT"),
      ],
    },
  ];
  return {
    id: "blog",
    name: "Blog de test",
    entities: tables,
    relations: [
      {
        id: "author",
        sourceEntityId: "users",
        sourceColumnId: "id",
        targetEntityId: "posts",
        targetColumnId: "author_id",
        cardinality: "1-N",
        onDelete: "RESTRICT",
      },
      {
        id: "tagging",
        sourceEntityId: "posts",
        sourceColumnId: "id",
        targetEntityId: "tags",
        targetColumnId: "id",
        cardinality: "N-N",
        name: "post_tags",
      },
      {
        id: "comments",
        sourceEntityId: "posts",
        sourceColumnId: "id",
        targetEntityId: "comments",
        targetColumnId: "post_id",
        cardinality: "1-N",
        onDelete: "CASCADE",
      },
    ],
  };
}
beforeEach(() => useEditor.getState().replace(exampleSchema()));
describe("editor regressions", () => {
  it("removes and restores a link, accepts reverse direction, and reconnects atomically", () => {
    const e = useEditor.getState();
    e.removeRelation("ownership");
    expect(
      useEditor.getState().connect({
        sourceEntityId: "projects",
        sourceColumnId: "owner-id",
        targetEntityId: "users",
        targetColumnId: "user-id",
      }),
    ).toBe(true);
    const id = useEditor.getState().schema.relations[0]!.id;
    expect(
      useEditor.getState().connect(
        {
          sourceEntityId: "users",
          sourceColumnId: "missing",
          targetEntityId: "projects",
          targetColumnId: "owner-id",
        },
        id,
      ),
    ).toBe(false);
    expect(useEditor.getState().schema.relations[0]!.id).toBe(id);
    expect(
      useEditor.getState().connect(
        {
          sourceEntityId: "users",
          sourceColumnId: "user-id",
          targetEntityId: "projects",
          targetColumnId: "title",
        },
        id,
      ),
    ).toBe(true);
    expect(useEditor.getState().schema.relations).toHaveLength(1);
    expect(useEditor.getState().schema.relations[0]!.targetColumnId).toBe(
      "title",
    );
  });
  it("can disable and restore a primary key after detaching its relation", () => {
    const e = useEditor.getState();
    e.removeRelation("ownership");
    e.patchColumn("users", "user-id", { isPrimaryKey: false });
    e.patchColumn("users", "user-id", { isPrimaryKey: true });
    expect(useEditor.getState().connect(exampleSchema().relations[0]!)).toBe(
      true,
    );
  });
  it("undoes deletion with all relations and redoes it", () => {
    const before = serializeProject(useEditor.getState().schema);
    useEditor.getState().removeTable("users");
    useEditor.getState().undo();
    expect(serializeProject(useEditor.getState().schema)).toBe(before);
    useEditor.getState().redo();
    expect(useEditor.getState().schema.entities).toHaveLength(1);
  });
  it("coalesces typing and invalidates redo after branching", () => {
    const e = useEditor.getState();
    e.rename("a");
    e.rename("ab");
    e.rename("abc");
    expect(useEditor.getState().past).toHaveLength(1);
    e.undo();
    e.addTable({ x: 0, y: 0 });
    expect(useEditor.getState().future).toHaveLength(0);
  });
  it("creates foreign columns automatically and preserves snapshots", () => {
    const e = useEditor.getState();
    e.snapshot("Initial");
    e.removeRelation("ownership");
    expect(
      e.connect({
        sourceEntityId: "users",
        sourceColumnId: "user-id",
        targetEntityId: "projects",
        targetColumnId: "",
      }),
    ).toBe(true);
    expect(useEditor.getState().schema.entities[1]!.attributes).toHaveLength(5);
    e.restore(useEditor.getState().snapshots[0]!.id);
    expect(useEditor.getState().schema.entities[1]!.attributes).toHaveLength(4);
  });
  it("locks a shared project until a local copy is created", () => {
    const e = useEditor.getState();
    e.replace(exampleSchema(), true);
    e.removeTable("users");
    expect(useEditor.getState().schema.entities).toHaveLength(2);
    e.copyShared();
    e.removeTable("users");
    expect(useEditor.getState().schema.entities).toHaveLength(1);
  });
});
describe("logical models and portable projects", () => {
  it("keeps legacy files readable and writes version two constraints", () => {
    const old = {
      format: "atlas-schematic",
      version: 1,
      schema: exampleSchema(),
    };
    expect(parseProject(old)).toEqual(old.schema);
    const s = blog();
    expect(JSON.parse(serializeProject(s)).version).toBe(2);
    expect(parseProject(JSON.parse(serializeProject(s)))).toEqual(s);
  });
  it("projects 1:N, 1:1 and N:N without mutating the editor", () => {
    const source = blog(),
      before = JSON.stringify(source),
      mld = mcdToMld(source);
    expect(mld.entities).toHaveLength(5);
    const join = mld.entities.find((e) => e.name === "post_tags")!;
    expect(join.attributes.every((a) => a.isPrimaryKey && !a.nullable)).toBe(
      true,
    );
    expect(join.attributes.map((a) => a.type)).toEqual(["INTEGER", "UUID"]);
    expect(mld.foreignKeys).toHaveLength(4);
    expect(JSON.stringify(source)).toBe(before);
    source.relations[0]!.cardinality = "1-1";
    expect(mcdToMld(source).foreignKeys[0]!.unique).toBe(true);
  });
  it("creates composite references and validates SET NULL", () => {
    const s = exampleSchema();
    s.entities[0]!.attributes[1]!.isPrimaryKey = true;
    const m = mcdToMld(s);
    expect(m.foreignKeys[0]!.sourceColumnIds).toHaveLength(2);
    expect(m.entities[1]!.attributes).toHaveLength(5);
    s.relations[0]!.onDelete = "SET NULL";
    expect(() => mcdToMld(s)).toThrow(/nullable/);
    s.entities[1]!.attributes[1]!.nullable = true;
    expect(() => mcdToMld(s)).not.toThrow();
  });
  it("round-trips shared data and rejects damaged or oversized tokens", () => {
    expect(decodeShare(encodeShare(blog()))).toEqual(blog());
    expect(() => decodeShare("9999999.aaa")).toThrow();
    expect(() => decodeShare("20.broken")).toThrow();
  });
});
describe("SQL import and generation", () => {
  it("round-trips a generated SQL schema with constraints", () => {
    const sql = generateSQL(exampleSchema());
    const imported = importSQL(sql);
    expect(imported.entities.map((e) => e.name)).toEqual(["users", "projects"]);
    expect(imported.relations).toHaveLength(1);
    expect(() => generateSQL(imported)).not.toThrow();
  });
  it("imports inline references, explicit composites, and quoted commas in defaults", () => {
    const s = importSQL(
      "CREATE TABLE users (id uuid PRIMARY KEY, label text DEFAULT 'a,b'); CREATE TABLE child (id serial PRIMARY KEY, owner_id uuid REFERENCES users(id) ON DELETE CASCADE);",
    );
    expect(s.entities[0]!.attributes[1]!.defaultValue).toContain("a,b");
    expect(s.relations[0]!.onDelete).toBe("CASCADE");
    const composite = importSQL(
      "CREATE TABLE p (a int, b uuid, PRIMARY KEY (a,b)); CREATE TABLE c (id serial PRIMARY KEY, p_a int, p_b uuid, FOREIGN KEY(p_a,p_b) REFERENCES p(a,b));",
    );
    expect(mcdToMld(composite).entities[1]!.attributes).toHaveLength(3);
    expect(mcdToMld(composite).foreignKeys[0]!.targetColumnIds).toHaveLength(2);
  });
  it("rejects unsupported DDL rather than silently dropping it", () => {
    expect(() =>
      importSQL("CREATE TABLE t (id uuid PRIMARY KEY, x text CHECK(x <> ''));"),
    ).toThrow(/CHECK/);
    expect(() => importSQL("INSERT INTO x VALUES (1)")).toThrow();
    expect(() =>
      importSQL("CREATE TABLE t (id uuid PRIMARY KEY, x xml);"),
    ).toThrow(/Type SQL/);
  });
});
describe("FastAPI project", () => {
  it("generates a complete archive with composite CRUD and late FK constraints", () => {
    const files = generateFastAPI(blog());
    expect(files["backend/app/routers/post_tags.py"]).toContain(
      "/{pk_posts_id}/{pk_tags_id}",
    );
    expect(files["backend/app/models/post_tags.py"]).toContain(
      "sa.ForeignKeyConstraint",
    );
    expect(files["backend/app/schemas/posts.py"]).toContain(
      "reject_explicit_nulls",
    );
    const migration = files["backend/alembic/versions/0001_initial.py"]!;
    expect(migration.lastIndexOf("op.create_table")).toBeLessThan(
      migration.indexOf("op.create_foreign_key"),
    );
    const unpacked = unzipSync(zipProject(files));
    expect(strFromU8(unpacked["backend/app/main.py"]!)).toBe(
      files["backend/app/main.py"],
    );
    expect(files["backend/docker-compose.yml"]).toContain("127.0.0.1:");
    if (process.env.ATHENA_EXPORT_FIXTURE) {
      for (const [name, content] of Object.entries(files)) {
        const path = resolve(process.env.ATHENA_EXPORT_FIXTURE, name);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
      }
      writeFileSync(
        resolve(process.env.ATHENA_EXPORT_FIXTURE, "blog.atlas.json"),
        serializeProject(blog()),
      );
    }
  });
  it("blocks unsafe identifiers and executable defaults with actionable errors", () => {
    const s = blog();
    s.entities[0]!.name = "../escape";
    expect(() => generateFastAPI(s)).toThrow(/snake_case/);
    s.entities[0]!.name = "users";
    s.entities[0]!.attributes[1]!.defaultValue = "'; DROP TABLE users;--";
    expect(() => generateFastAPI(s)).toThrow(/Défaut/);
    s.entities[0]!.attributes[1]!.defaultValue = undefined;
    s.entities[0]!.attributes[1]!.name = "metadata";
    expect(() => generateFastAPI(s)).toThrow(/réservé/);
  });
});
