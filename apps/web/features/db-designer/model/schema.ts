import { z } from "zod";
export const columnTypes = [
  "UUID",
  "INTEGER",
  "BIGINT",
  "SERIAL",
  "VARCHAR",
  "TEXT",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
  "NUMERIC",
  "JSONB",
] as const;
const id = z.string().min(1).max(100);
const column = z.object({
  id,
  name: z.string().max(100),
  type: z.enum(columnTypes),
  isPrimaryKey: z.boolean(),
  nullable: z.boolean(),
});
const entity = z.object({
  id,
  name: z.string().max(100),
  position: z.object({
    x: z.number().finite().min(-100000).max(100000),
    y: z.number().finite().min(-100000).max(100000),
  }),
  attributes: z.array(column).max(100),
});
const relation = z.object({
  id,
  sourceEntityId: id,
  sourceColumnId: id,
  targetEntityId: id,
  targetColumnId: id,
  cardinality: z.enum(["1-1", "1-N", "N-N"]),
});
export const projectFile = z.object({
  format: z.literal("atlas-schematic"),
  version: z.literal(1),
  schema: z.object({
    id,
    name: z.string().min(1).max(100),
    entities: z.array(entity).max(200),
    relations: z.array(relation).max(2000),
  }),
});
export type Attribute = z.infer<typeof column>;
export type Entity = z.infer<typeof entity>;
export type Relation = z.infer<typeof relation>;
export type Schema = z.infer<typeof projectFile>["schema"];
export function parseProject(value: unknown): Schema {
  const { schema } = projectFile.parse(value);
  const entityIds = new Set(schema.entities.map((e) => e.id));
  if (entityIds.size !== schema.entities.length)
    throw new Error("Identifiants de tables dupliqués.");
  const relationIds = new Set<string>();
  const targets = new Set<string>();
  for (const entity of schema.entities) {
    if (
      new Set(entity.attributes.map((a) => a.id)).size !==
      entity.attributes.length
    )
      throw new Error("Identifiants de colonnes dupliqués.");
    if (entity.attributes.some((a) => a.isPrimaryKey && a.nullable))
      throw new Error("Une clé primaire ne peut pas être nullable.");
  }
  for (const relation of schema.relations) {
    const source = schema.entities
      .find((e) => e.id === relation.sourceEntityId)
      ?.attributes.find((a) => a.id === relation.sourceColumnId);
    const target = schema.entities
      .find((e) => e.id === relation.targetEntityId)
      ?.attributes.find((a) => a.id === relation.targetColumnId);
    const targetKey = JSON.stringify([
      relation.targetEntityId,
      relation.targetColumnId,
    ]);
    if (
      !source ||
      !target ||
      !source.isPrimaryKey ||
      relationIds.has(relation.id) ||
      targets.has(targetKey) ||
      (relation.sourceEntityId === relation.targetEntityId &&
        relation.sourceColumnId === relation.targetColumnId)
    )
      throw new Error("Une relation est invalide ou dupliquée.");
    if (target.type !== (source.type === "SERIAL" ? "INTEGER" : source.type))
      throw new Error("Les types de colonnes liées sont incompatibles.");
    relationIds.add(relation.id);
    targets.add(targetKey);
  }
  return schema;
}
export function serializeProject(schema: Schema) {
  const value = { format: "atlas-schematic", version: 1, schema };
  parseProject(value);
  return JSON.stringify(value, null, 2);
}
export function exampleSchema(): Schema {
  return {
    id: "example",
    name: "Mon premier schéma",
    entities: [
      {
        id: "users",
        name: "users",
        position: { x: 100, y: 110 },
        attributes: [
          {
            id: "user-id",
            name: "id",
            type: "UUID",
            isPrimaryKey: true,
            nullable: false,
          },
          {
            id: "email",
            name: "email",
            type: "VARCHAR",
            isPrimaryKey: false,
            nullable: false,
          },
          {
            id: "username",
            name: "username",
            type: "VARCHAR",
            isPrimaryKey: false,
            nullable: false,
          },
          {
            id: "joined",
            name: "created_at",
            type: "TIMESTAMP",
            isPrimaryKey: false,
            nullable: false,
          },
        ],
      },
      {
        id: "projects",
        name: "projects",
        position: { x: 610, y: 220 },
        attributes: [
          {
            id: "project-id",
            name: "id",
            type: "UUID",
            isPrimaryKey: true,
            nullable: false,
          },
          {
            id: "owner-id",
            name: "owner_id",
            type: "UUID",
            isPrimaryKey: false,
            nullable: false,
          },
          {
            id: "title",
            name: "title",
            type: "VARCHAR",
            isPrimaryKey: false,
            nullable: false,
          },
          {
            id: "description",
            name: "description",
            type: "TEXT",
            isPrimaryKey: false,
            nullable: true,
          },
        ],
      },
    ],
    relations: [
      {
        id: "ownership",
        sourceEntityId: "users",
        sourceColumnId: "user-id",
        targetEntityId: "projects",
        targetColumnId: "owner-id",
        cardinality: "1-N",
      },
    ],
  };
}
