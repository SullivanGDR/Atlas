import type { Attribute, Entity, Schema } from "../model/schema";
import { mcdToMld, type LogicalSchema } from "../transforms/mcd-to-mld";

const reserved = new Set(
  "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield metadata registry model_config model_fields model_computed_fields reject_explicit_nulls".split(
    " ",
  ),
);
export function validateNames(schema: LogicalSchema) {
  if (!schema.entities.length)
    throw new Error("Ajoutez au moins une table avant de générer le projet.");
  const names = new Set<string>();
  for (const e of schema.entities) {
    if (!/^[a-z][a-z0-9_]{0,52}$/.test(e.name))
      throw new Error(
        "Table « " +
          e.name +
          " » : utilisez 1 à 53 caractères en snake_case (lettres, chiffres, _).",
      );
    if (names.has(e.name))
      throw new Error("Nom de table dupliqué : " + e.name + ".");
    if (reserved.has(e.name) || ["docs", "redoc", "health"].includes(e.name))
      throw new Error(
        "Le nom de table " +
          e.name +
          " est réservé par Python ou FastAPI. Renommez cette table.",
      );
    names.add(e.name);
    if (!e.attributes.some((a) => a.isPrimaryKey))
      throw new Error("La table " + e.name + " doit avoir une clé primaire.");
    const columns = new Set<string>();
    for (const a of e.attributes) {
      if (
        !/^[a-z][a-z0-9_]{0,62}$/.test(a.name) ||
        reserved.has(a.name) ||
        a.name.startsWith("model_") ||
        a.name.startsWith("ref_")
      )
        throw new Error(
          e.name +
            "." +
            a.name +
            " : choisissez un nom snake_case non réservé (sans préfixe model_ ou ref_).",
        );
      if (columns.has(a.name))
        throw new Error("Colonne dupliquée : " + e.name + "." + a.name);
      columns.add(a.name);
      if (a.type === "NUMERIC" && (a.scale ?? 2) > (a.precision ?? 18))
        throw new Error(
          e.name + "." + a.name + " : l’échelle dépasse la précision.",
        );
      defaultSQL(a);
    }
  }
}
export const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
export const foreignColumn = (s: LogicalSchema, e: Entity, a: Attribute) =>
  s.foreignKeys.some(
    (f) => f.targetEntityId === e.id && f.targetColumnIds.includes(a.id),
  );
export function defaultSQL(a: Attribute): string | undefined {
  const value = a.defaultValue?.trim();
  if (!value) return undefined;
  if (/^(true|false)$/i.test(value) && a.type === "BOOLEAN")
    return value.toUpperCase();
  if (/^null$/i.test(value) && a.nullable) return "NULL";
  if (
    /^-?\d+(\.\d+)?$/.test(value) &&
    ["INTEGER", "BIGINT", "SERIAL", "NUMERIC"].includes(a.type)
  )
    return value;
  if (/^(now\(\)|current_timestamp)$/i.test(value) && a.type === "TIMESTAMP")
    return "CURRENT_TIMESTAMP";
  if (/^current_date$/i.test(value) && a.type === "DATE") return "CURRENT_DATE";
  if (/^gen_random_uuid\(\)$/i.test(value) && a.type === "UUID")
    return "gen_random_uuid()";
  if (
    /^'(?:[^']|'')*'$/.test(value) &&
    ["VARCHAR", "TEXT", "DATE", "TIMESTAMP", "UUID", "JSONB"].includes(a.type)
  ) {
    const literal = value.slice(1, -1).replaceAll("''", "'");
    if (literal.includes("\0"))
      throw new Error("Un défaut SQL ne peut pas contenir un caractère nul.");
    if (
      a.type === "UUID" &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        literal,
      )
    )
      throw new Error("UUID par défaut invalide pour " + a.name + ".");
    if (a.type === "JSONB") {
      try {
        JSON.parse(literal);
      } catch {
        throw new Error("JSON par défaut invalide pour " + a.name + ".");
      }
    }
    return value;
  }
  throw new Error(
    "Défaut non pris en charge pour " +
      a.name +
      " : utilisez une valeur SQL littérale compatible, CURRENT_TIMESTAMP, CURRENT_DATE ou gen_random_uuid().",
  );
}
export function columnDefault(s: LogicalSchema, e: Entity, a: Attribute) {
  return (
    defaultSQL(a) ??
    (a.isPrimaryKey && a.type === "UUID" && !foreignColumn(s, e, a)
      ? "gen_random_uuid()"
      : undefined)
  );
}
export function sqlType(a: Attribute) {
  if (a.type === "VARCHAR") return "VARCHAR(" + (a.length ?? 255) + ")";
  if (a.type === "NUMERIC")
    return "NUMERIC(" + (a.precision ?? 18) + ", " + (a.scale ?? 2) + ")";
  return a.type;
}
export function generateSQL(input: Schema) {
  const s = mcdToMld(input);
  validateNames(s);
  const tables = s.entities.map((e) => {
    const fields = e.attributes.map((a) => {
      const def = columnDefault(s, e, a);
      return (
        "  " +
        quote(a.name) +
        " " +
        sqlType(a) +
        (a.nullable && !a.isPrimaryKey ? "" : " NOT NULL") +
        (a.unique ? " UNIQUE" : "") +
        (def ? " DEFAULT " + def : "")
      );
    });
    fields.push(
      "  PRIMARY KEY (" +
        e.attributes
          .filter((a) => a.isPrimaryKey)
          .map((a) => quote(a.name))
          .join(", ") +
        ")",
    );
    return (
      "CREATE TABLE " + quote(e.name) + " (\n" + fields.join(",\n") + "\n);"
    );
  });
  const constraints = s.foreignKeys.map((fk, i) => {
    const src = s.entities.find((e) => e.id === fk.sourceEntityId)!,
      dst = s.entities.find((e) => e.id === fk.targetEntityId)!;
    const local = fk.targetColumnIds
      .map((id) => quote(dst.attributes.find((a) => a.id === id)!.name))
      .join(", ");
    const remote = fk.sourceColumnIds
      .map((id) => quote(src.attributes.find((a) => a.id === id)!.name))
      .join(", ");
    return (
      "ALTER TABLE " +
      quote(dst.name) +
      " ADD CONSTRAINT " +
      quote("fk_athena_" + i) +
      " FOREIGN KEY (" +
      local +
      ") REFERENCES " +
      quote(src.name) +
      " (" +
      remote +
      ") ON DELETE " +
      fk.onDelete +
      ";" +
      (fk.unique
        ? "\nALTER TABLE " +
          quote(dst.name) +
          " ADD CONSTRAINT " +
          quote("uq_athena_" + i) +
          " UNIQUE (" +
          local +
          ");"
        : "")
    );
  });
  return (
    "-- Generated by Athena · PostgreSQL\nBEGIN;\n\n" +
    [...tables, ...constraints].join("\n\n") +
    "\n\nCOMMIT;\n"
  );
}
