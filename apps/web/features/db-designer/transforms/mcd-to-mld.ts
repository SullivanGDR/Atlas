import {
  parseProject,
  type Attribute,
  type Entity,
  type Relation,
  type Schema,
} from "../model/schema";

export interface ForeignKey {
  id: string;
  sourceEntityId: string;
  sourceColumnIds: string[];
  targetEntityId: string;
  targetColumnIds: string[];
  onDelete: NonNullable<Relation["onDelete"]>;
  unique: boolean;
}
export interface LogicalSchema extends Schema {
  foreignKeys: ForeignKey[];
}
const referenceType = (a: Attribute): Attribute["type"] =>
  a.type === "SERIAL" ? "INTEGER" : a.type;

/** Pure projection: the editable model is never changed by opening its MLD. */
export function mcdToMld(input: Schema): LogicalSchema {
  parseProject({ format: "atlas-athena", version: 2, schema: input });
  const schema: LogicalSchema = {
    ...structuredClone(input),
    relations: [],
    foreignKeys: [],
  };
  const uniqueName = (base: string, used: string[]) => {
    let name = base.slice(0, 54),
      i = 2;
    while (used.includes(name)) name = base.slice(0, 54) + "_" + i++;
    return name;
  };
  const addFK = (
    id: string,
    source: Entity,
    keys: Attribute[],
    target: Entity,
    columns: Attribute[],
    r: Relation,
    unique = false,
  ) => {
    const onDelete =
      r.onDelete ?? (r.cardinality === "N-N" ? "CASCADE" : "RESTRICT");
    if (
      onDelete === "SET NULL" &&
      columns.some((a) => !a.nullable || a.isPrimaryKey)
    )
      throw new Error(
        "SET NULL exige des colonnes étrangères nullables dans " +
          target.name +
          ".",
      );
    schema.foreignKeys.push({
      id,
      sourceEntityId: source.id,
      sourceColumnIds: keys.map((a) => a.id),
      targetEntityId: target.id,
      targetColumnIds: columns.map((a) => a.id),
      onDelete,
      unique,
    });
    columns.forEach((a, i) =>
      schema.relations.push({
        ...r,
        columnPairs: undefined,
        id: id + ":" + i,
        sourceEntityId: source.id,
        sourceColumnId: keys[i]!.id,
        targetEntityId: target.id,
        targetColumnId: a.id,
        cardinality: unique ? "1-1" : "1-N",
      }),
    );
  };
  for (const r of input.relations) {
    if (
      schema.entities.length > 1000 ||
      schema.entities.reduce((n, e) => n + e.attributes.length, 0) > 20000
    )
      throw new Error(
        "Le modèle logique dépasse la limite de génération (1 000 tables ou 20 000 colonnes).",
      );
    const source = schema.entities.find((e) => e.id === r.sourceEntityId);
    const target = schema.entities.find((e) => e.id === r.targetEntityId);
    if (!source || !target) throw new Error("Table référencée introuvable.");
    const selectedKey = source.attributes.find(
      (a) => a.id === r.sourceColumnId,
    );
    if (!selectedKey?.isPrimaryKey)
      throw new Error("La relation doit partir d’une clé primaire.");
    const keys = selectedKey.unique
      ? [selectedKey]
      : source.attributes.filter((a) => a.isPrimaryKey);
    if (r.cardinality === "N-N") {
      const targetKeys = target.attributes.filter((a) => a.isPrimaryKey);
      if (!targetKeys.length)
        throw new Error("Ajoutez une clé primaire à " + target.name + ".");
      const join: Entity = {
        id: "join:" + r.id,
        name: uniqueName(
          r.name?.trim() || source.name + "_" + target.name,
          schema.entities.map((e) => e.name),
        ),
        position: {
          x: (source.position.x + target.position.x) / 2,
          y: Math.max(source.position.y, target.position.y) + 350,
        },
        attributes: [],
      };
      const make = (e: Entity, list: Attribute[], side: string) =>
        list.map((a, i) => {
          const col: Attribute = {
            ...a,
            id: "join:" + r.id + ":" + side + ":" + i,
            name: uniqueName(
              e.name + "_" + a.name,
              join.attributes.map((a) => a.name),
            ),
            type: referenceType(a),
            isPrimaryKey: true,
            nullable: false,
            unique: false,
            defaultValue: undefined,
          };
          join.attributes.push(col);
          return col;
        });
      const left = make(source, keys, "left"),
        right = make(target, targetKeys, "right");
      schema.entities.push(join);
      addFK(r.id + ":left", source, keys, join, left, r);
      addFK(r.id + ":right", target, targetKeys, join, right, r);
    } else {
      const selectedTarget = target.attributes.find(
        (a) => a.id === r.targetColumnId,
      );
      if (!selectedTarget)
        throw new Error(
          "Colonne étrangère introuvable dans " + target.name + ".",
        );
      const columns = keys.map((a, i) => {
        const mapped = r.columnPairs?.find((p) => p.sourceColumnId === a.id);
        let col = mapped
          ? target.attributes.find((c) => c.id === mapped.targetColumnId)
          : a.id === selectedKey.id
            ? selectedTarget
            : undefined;
        if (!col) {
          col = {
            ...a,
            id: "fk:" + r.id + ":" + i,
            name: uniqueName(
              source.name + "_" + a.name,
              target.attributes.map((a) => a.name),
            ),
            isPrimaryKey: selectedTarget.isPrimaryKey,
            nullable: selectedTarget.nullable,
            unique: false,
            defaultValue: undefined,
          };
          target.attributes.push(col);
        }
        Object.assign(col, {
          type: referenceType(a),
          length: a.length,
          precision: a.precision,
          scale: a.scale,
        });
        return col;
      });
      addFK(r.id, source, keys, target, columns, r, r.cardinality === "1-1");
    }
  }
  // A referenced key may itself be a foreign key.
  for (let pass = 0; pass <= schema.entities.length; pass++) {
    let changed = false;
    for (const r of schema.relations) {
      const a = schema.entities
        .find((e) => e.id === r.sourceEntityId)!
        .attributes.find((a) => a.id === r.sourceColumnId)!;
      const b = schema.entities
        .find((e) => e.id === r.targetEntityId)!
        .attributes.find((a) => a.id === r.targetColumnId)!;
      if (b.type !== referenceType(a)) changed = true;
      b.type = referenceType(a);
      b.length = a.length;
      b.precision = a.precision;
      b.scale = a.scale;
    }
    if (!changed) break;
  }
  return schema;
}
