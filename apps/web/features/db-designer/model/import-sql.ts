import {
  parse,
  toSql,
  type TableConstraint,
  type TableReference,
} from "pgsql-ast-parser";
import {
  parseProject,
  type Attribute,
  type Entity,
  type Schema,
} from "./schema";

/** DDL only. Unsupported constructs fail explicitly; no SQL is executed. */
export function importSQL(sql: string, name = "Schéma importé"): Schema {
  if (new TextEncoder().encode(sql).length > 1024 * 1024)
    throw new Error("Import SQL limité à 1 Mo.");
  let statements;
  try {
    statements = parse(sql);
  } catch {
    throw new Error(
      "SQL non reconnu. Importez des CREATE TABLE PostgreSQL et ALTER TABLE ADD CONSTRAINT.",
    );
  }
  const schema: Schema = {
    id: crypto.randomUUID(),
    name: name.slice(0, 100),
    entities: [],
    relations: [],
  };
  const references: {
    target: Entity;
    columns: string[];
    ref: TableReference;
  }[] = [];
  const constraints: { target: Entity; value: TableConstraint }[] = [];
  const types: Record<string, Attribute["type"]> = {
    uuid: "UUID",
    int: "INTEGER",
    integer: "INTEGER",
    int4: "INTEGER",
    bigint: "BIGINT",
    int8: "BIGINT",
    serial: "SERIAL",
    serial4: "SERIAL",
    varchar: "VARCHAR",
    "character varying": "VARCHAR",
    text: "TEXT",
    bool: "BOOLEAN",
    boolean: "BOOLEAN",
    date: "DATE",
    timestamp: "TIMESTAMP",
    "timestamp without time zone": "TIMESTAMP",
    numeric: "NUMERIC",
    decimal: "NUMERIC",
    jsonb: "JSONB",
  };
  const checkSchema = (s?: string) => {
    if (s && s !== "public")
      throw new Error("Seul le schéma PostgreSQL public est pris en charge.");
  };
  for (const stmt of statements) {
    if (stmt.type !== "create table") continue;
    checkSchema(stmt.name.schema);
    if (stmt.inherits?.length || stmt.temporary || stmt.unlogged)
      throw new Error(
        "Héritage et tables temporaires/unlogged non pris en charge.",
      );
    if (schema.entities.some((e) => e.name === stmt.name.name))
      throw new Error("Table dupliquée : " + stmt.name.name);
    const e: Entity = {
      id: crypto.randomUUID(),
      name: stmt.name.name,
      position: {
        x: (schema.entities.length % 3) * 480,
        y: Math.floor(schema.entities.length / 3) * 450,
      },
      attributes: [],
    };
    for (const c of stmt.columns) {
      if (c.kind !== "column" || c.dataType.kind === "array" || c.collate)
        throw new Error(
          "LIKE, tableaux SQL et collations ne sont pas pris en charge.",
        );
      const type = types[c.dataType.name.toLowerCase()];
      if (!type)
        throw new Error(
          "Type SQL non pris en charge : " + c.dataType.name + ".",
        );
      const a: Attribute = {
        id: crypto.randomUUID(),
        name: c.name.name,
        type,
        nullable: true,
        isPrimaryKey: false,
      };
      if (type === "VARCHAR") a.length = c.dataType.config?.[0];
      if (type === "NUMERIC") {
        a.precision = c.dataType.config?.[0];
        a.scale = c.dataType.config?.[1] ?? (a.precision ? 0 : undefined);
      }
      for (const con of c.constraints ?? []) {
        if (con.type === "primary key") {
          a.isPrimaryKey = true;
          a.nullable = false;
        } else if (con.type === "not null") a.nullable = false;
        else if (con.type === "null") a.nullable = true;
        else if (con.type === "unique") a.unique = true;
        else if (con.type === "default") {
          let value = toSql.expr(con.default).trim();
          while (value.startsWith("(") && value.endsWith(")"))
            value = value.slice(1, -1).trim();
          a.defaultValue = value.replace(/\s*\(\s*\)/g, "()");
        } else if (con.type === "reference")
          references.push({ target: e, columns: [a.name], ref: con });
        else
          throw new Error(
            "Contrainte de colonne non prise en charge : " +
              con.type.toUpperCase(),
          );
      }
      if (a.isPrimaryKey) a.nullable = false;
      e.attributes.push(a);
    }
    schema.entities.push(e);
    for (const value of stmt.constraints ?? [])
      constraints.push({ target: e, value });
  }
  for (const stmt of statements) {
    if (["create table", "begin", "commit"].includes(stmt.type)) continue;
    if (stmt.type !== "alter table")
      throw new Error(
        "Instruction non prise en charge : " +
          stmt.type +
          ". Importez uniquement la structure, sans données.",
      );
    checkSchema(stmt.table.schema);
    const target = schema.entities.find((e) => e.name === stmt.table.name);
    if (!target) throw new Error("ALTER TABLE : table absente du fichier.");
    for (const change of stmt.changes) {
      if (change.type !== "add constraint")
        throw new Error("Seul ALTER TABLE ADD CONSTRAINT est pris en charge.");
      constraints.push({ target, value: change.constraint });
    }
  }
  for (const { target, value } of constraints) {
    if (value.type === "foreign key") {
      references.push({
        target,
        columns: value.localColumns.map((c) => c.name),
        ref: value,
      });
      continue;
    }
    if (value.type === "check")
      throw new Error(
        "Les contraintes CHECK ne sont pas encore représentables dans Athena.",
      );
    if (value.type === "unique" && value.columns.length !== 1)
      throw new Error(
        "Les contraintes UNIQUE composites ne sont pas prises en charge à l’import.",
      );
    for (const c of value.columns) {
      const a = target.attributes.find((a) => a.name === c.name);
      if (!a) throw new Error("Colonne de contrainte introuvable : " + c.name);
      if (value.type === "primary key") {
        a.isPrimaryKey = true;
        a.nullable = false;
      } else a.unique = true;
    }
  }
  for (const { target, columns, ref } of references) {
    checkSchema(ref.foreignTable.schema);
    const source = schema.entities.find(
      (e) => e.name === ref.foreignTable.name,
    );
    if (!source)
      throw new Error("Table référencée absente : " + ref.foreignTable.name);
    if (ref.onUpdate && ref.onUpdate !== "no action")
      throw new Error("ON UPDATE personnalisé non pris en charge.");
    if (ref.match && ref.match !== "simple")
      throw new Error("MATCH personnalisé non pris en charge.");
    const keys = ref.foreignColumns.length
      ? ref.foreignColumns.map((c) =>
          source.attributes.find((a) => a.name === c.name),
        )
      : source.attributes.filter((a) => a.isPrimaryKey);
    const targets = columns.map((c) =>
      target.attributes.find((a) => a.name === c),
    );
    if (
      keys.length !== targets.length ||
      !keys.length ||
      keys.some((a) => !a?.isPrimaryKey) ||
      targets.some((a) => !a)
    )
      throw new Error(
        "La référence doit pointer vers une clé primaire complète.",
      );
    if (
      keys.length !== source.attributes.filter((a) => a.isPrimaryKey).length &&
      !keys[0]?.unique
    )
      throw new Error("Clé composite incomplète.");
    const onDelete = (ref.onDelete ?? "restrict").toUpperCase();
    if (!["RESTRICT", "NO ACTION", "CASCADE", "SET NULL"].includes(onDelete))
      throw new Error("ON DELETE non pris en charge : " + onDelete);
    targets.forEach((a, i) => {
      a!.type = keys[i]!.type === "SERIAL" ? "INTEGER" : keys[i]!.type;
    });
    schema.relations.push({
      id: crypto.randomUUID(),
      sourceEntityId: source.id,
      sourceColumnId: keys[0]!.id,
      targetEntityId: target.id,
      targetColumnId: targets[0]!.id,
      columnPairs: keys.map((a, i) => ({
        sourceColumnId: a!.id,
        targetColumnId: targets[i]!.id,
      })),
      cardinality: targets.length === 1 && targets[0]!.unique ? "1-1" : "1-N",
      onDelete:
        onDelete === "NO ACTION"
          ? "RESTRICT"
          : (onDelete as "RESTRICT" | "CASCADE" | "SET NULL"),
    });
  }
  if (!schema.entities.length)
    throw new Error("Aucun CREATE TABLE dans ce fichier.");
  return parseProject({ format: "atlas-athena", version: 2, schema });
}
