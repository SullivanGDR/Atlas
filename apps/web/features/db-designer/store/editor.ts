import { create } from "zustand";
import {
  exampleSchema,
  type Attribute,
  type Relation,
  type Schema,
} from "../model/schema";

export type ConnectionDraft = Pick<
  Relation,
  "sourceEntityId" | "sourceColumnId" | "targetEntityId" | "targetColumnId"
> &
  Partial<Pick<Relation, "cardinality" | "name" | "onDelete">>;
interface Snapshot {
  id: string;
  name: string;
  schema: Schema;
}
interface EditorState {
  schema: Schema;
  dirty: boolean;
  notice: string;
  past: Schema[];
  future: Schema[];
  snapshots: Snapshot[];
  readOnly: boolean;
  lastEdit: { key: string; time: number } | null;
  rename: (name: string) => void;
  replace: (schema: Schema, readOnly?: boolean) => void;
  saved: () => void;
  notify: (notice: string) => void;
  undo: () => void;
  redo: () => void;
  snapshot: (name: string) => void;
  restore: (id: string) => void;
  copyShared: () => void;
  addTable: (position: { x: number; y: number }) => string;
  duplicateTable: (id: string) => void;
  removeTable: (id: string) => void;
  moveTable: (id: string, position: { x: number; y: number }) => void;
  arrange: () => void;
  renameTable: (id: string, name: string) => void;
  addColumn: (id: string) => void;
  patchColumn: (tableId: string, id: string, patch: Partial<Attribute>) => void;
  removeColumn: (tableId: string, id: string) => void;
  connect: (relation: ConnectionDraft, replaceId?: string) => boolean;
  removeRelation: (id: string) => void;
  patchRelation: (
    id: string,
    patch: Partial<Pick<Relation, "name" | "onDelete">>,
  ) => void;
  cardinality: (id: string, value: Relation["cardinality"]) => void;
}
const uuid = () => crypto.randomUUID();
const freshColumn = (name: string, primary = false): Attribute => ({
  id: uuid(),
  name,
  type: primary ? "UUID" : "VARCHAR",
  isPrimaryKey: primary,
  nullable: false,
});
function followTypes(schema: Schema) {
  for (let pass = 0; pass <= schema.entities.length; pass++) {
    let changed = false;
    for (const r of schema.relations) {
      if (r.cardinality === "N-N") continue;
      for (const pair of r.columnPairs ?? [
        { sourceColumnId: r.sourceColumnId, targetColumnId: r.targetColumnId },
      ]) {
        const a = schema.entities
          .find((e) => e.id === r.sourceEntityId)
          ?.attributes.find((a) => a.id === pair.sourceColumnId);
        const b = schema.entities
          .find((e) => e.id === r.targetEntityId)
          ?.attributes.find((a) => a.id === pair.targetColumnId);
        if (!a || !b) continue;
        const type = a.type === "SERIAL" ? "INTEGER" : a.type;
        if (
          b.type !== type ||
          b.length !== a.length ||
          b.precision !== a.precision ||
          b.scale !== a.scale
        )
          changed = true;
        Object.assign(b, {
          type,
          length: a.length,
          precision: a.precision,
          scale: a.scale,
        });
      }
    }
    if (!changed) break;
  }
}
export const useEditor = create<EditorState>((set, get) => {
  const edit = (
    change: (schema: Schema) => void,
    key = "",
    notice?: string,
  ) => {
    const s = get();
    if (s.readOnly) return;
    const schema = structuredClone(s.schema);
    change(schema);
    if (JSON.stringify(schema) === JSON.stringify(s.schema)) return;
    const time = Date.now();
    const coalesce =
      key && s.lastEdit?.key === key && time - s.lastEdit.time < 650;
    set({
      schema,
      dirty: true,
      past: coalesce ? s.past : [...s.past, s.schema].slice(-80),
      future: [],
      lastEdit: { key, time },
      ...(notice ? { notice } : {}),
    });
  };
  return {
    schema: exampleSchema(),
    dirty: false,
    readOnly: false,
    notice: "",
    past: [],
    future: [],
    snapshots: [],
    lastEdit: null,
    notify: (notice) => set({ notice }),
    rename: (name) =>
      edit((s) => {
        s.name = name;
      }, "project-name"),
    replace: (schema, readOnly = false) =>
      set({
        schema: structuredClone(schema),
        dirty: false,
        readOnly,
        past: [],
        future: [],
        snapshots: [],
        lastEdit: null,
        notice: readOnly ? "Schéma partagé · lecture seule" : "Projet ouvert.",
      }),
    saved: () =>
      set({ dirty: false, notice: "Projet exporté.", lastEdit: null }),
    undo: () => {
      const s = get();
      if (s.readOnly || !s.past.length) return;
      set({
        schema: s.past[s.past.length - 1]!,
        past: s.past.slice(0, -1),
        future: [s.schema, ...s.future],
        dirty: true,
        lastEdit: null,
        notice: "Modification annulée.",
      });
    },
    redo: () => {
      const s = get();
      if (s.readOnly || !s.future.length) return;
      set({
        schema: s.future[0]!,
        past: [...s.past, s.schema],
        future: s.future.slice(1),
        dirty: true,
        lastEdit: null,
        notice: "Modification rétablie.",
      });
    },
    snapshot: (name) => {
      const s = get();
      if (s.readOnly) return;
      set({
        snapshots: [
          ...s.snapshots,
          {
            id: uuid(),
            name: name.trim() || "Version " + (s.snapshots.length + 1),
            schema: structuredClone(s.schema),
          },
        ].slice(-20),
        notice: "Version conservée pour cette session.",
      });
    },
    restore: (id) => {
      const snapshot = get().snapshots.find((s) => s.id === id);
      if (snapshot)
        edit(
          (s) => Object.assign(s, structuredClone(snapshot.schema)),
          "",
          "Version restaurée. Vous pouvez annuler cette action.",
        );
    },
    copyShared: () =>
      set({
        readOnly: false,
        dirty: true,
        notice: "Copie modifiable. Exportez-la pour la conserver.",
      }),
    addTable: (position) => {
      if (get().readOnly || get().schema.entities.length >= 200) {
        get().notify("Limite de 200 tables.");
        return "";
      }
      const id = uuid();
      edit((s) => {
        let i = 1;
        while (s.entities.some((e) => e.name === "table_" + i)) i++;
        s.entities.push({
          id,
          name: "table_" + i,
          position,
          attributes: [freshColumn("id", true)],
        });
      });
      return id;
    },
    duplicateTable: (id) =>
      edit((s) => {
        const table = s.entities.find((e) => e.id === id);
        if (!table || s.entities.length >= 200) return;
        let i = 1;
        let name = table.name.slice(0, 85) + "_copy";
        while (s.entities.some((e) => e.name === name))
          name = table.name.slice(0, 85) + "_copy_" + i++;
        s.entities.push({
          ...structuredClone(table),
          id: uuid(),
          name,
          position: { x: table.position.x + 48, y: table.position.y + 48 },
          attributes: table.attributes.map((a) => ({ ...a, id: uuid() })),
        });
      }),
    removeTable: (id) =>
      edit((s) => {
        s.entities = s.entities.filter((e) => e.id !== id);
        s.relations = s.relations.filter(
          (r) => r.sourceEntityId !== id && r.targetEntityId !== id,
        );
      }),
    moveTable: (id, position) =>
      edit((s) => {
        const e = s.entities.find((e) => e.id === id);
        if (e) e.position = position;
      }, "move:" + id),
    arrange: () =>
      edit((s) => {
        const columns = Math.max(1, Math.ceil(Math.sqrt(s.entities.length)));
        const step =
          Math.max(
            300,
            ...s.entities.map((e) => 130 + e.attributes.length * 42),
          ) + 80;
        s.entities.forEach((e, i) => {
          e.position = {
            x: (i % columns) * 480,
            y: Math.floor(i / columns) * step,
          };
        });
      }),
    renameTable: (id, name) =>
      edit((s) => {
        const e = s.entities.find((e) => e.id === id);
        if (e) e.name = name;
      }, "table:" + id),
    addColumn: (id) =>
      edit((s) => {
        const e = s.entities.find((e) => e.id === id);
        if (!e || e.attributes.length >= 100) return;
        let i = 1;
        while (e.attributes.some((a) => a.name === "column_" + i)) i++;
        e.attributes.push(freshColumn("column_" + i));
      }),
    patchColumn: (tableId, id, patch) => {
      const s = get();
      if (
        patch.isPrimaryKey === false &&
        s.schema.relations.some(
          (r) =>
            r.sourceEntityId === tableId &&
            (r.sourceColumnId === id ||
              r.columnPairs?.some((p) => p.sourceColumnId === id)),
        )
      ) {
        s.notify("Détachez les relations de cette clé avant de la désactiver.");
        return;
      }
      if (
        (patch.type ||
          "length" in patch ||
          "precision" in patch ||
          "scale" in patch) &&
        s.schema.relations.some(
          (r) =>
            r.cardinality !== "N-N" &&
            r.targetEntityId === tableId &&
            (r.targetColumnId === id ||
              r.columnPairs?.some((p) => p.targetColumnId === id)),
        )
      ) {
        s.notify("Le type de la clé étrangère suit la clé référencée.");
        return;
      }
      edit(
        (schema) => {
          const a = schema.entities
            .find((e) => e.id === tableId)
            ?.attributes.find((a) => a.id === id);
          if (!a) return;
          Object.assign(a, patch);
          if (a.isPrimaryKey) a.nullable = false;
          followTypes(schema);
        },
        "column:" + tableId + ":" + id,
      );
    },
    removeColumn: (tableId, id) =>
      edit((s) => {
        const e = s.entities.find((e) => e.id === tableId);
        if (e) e.attributes = e.attributes.filter((a) => a.id !== id);
        s.relations = s.relations.filter(
          (r) =>
            !(
              r.sourceEntityId === tableId &&
              (r.sourceColumnId === id ||
                r.columnPairs?.some((p) => p.sourceColumnId === id))
            ) &&
            !(
              r.targetEntityId === tableId &&
              (r.targetColumnId === id ||
                r.columnPairs?.some((p) => p.targetColumnId === id))
            ),
        );
      }),
    connect: (draft, replaceId) => {
      const state = get();
      if (state.readOnly) return false;
      const relation = { ...draft, cardinality: draft.cardinality ?? "1-N" };
      const find = (entity: string, column: string) =>
        state.schema.entities
          .find((e) => e.id === entity)
          ?.attributes.find((a) => a.id === column);
      let source = find(relation.sourceEntityId, relation.sourceColumnId);
      let target = find(relation.targetEntityId, relation.targetColumnId);
      if (!source?.isPrimaryKey && target?.isPrimaryKey) {
        [relation.sourceEntityId, relation.targetEntityId] = [
          relation.targetEntityId,
          relation.sourceEntityId,
        ];
        [relation.sourceColumnId, relation.targetColumnId] = [
          relation.targetColumnId,
          relation.sourceColumnId,
        ];
        [source, target] = [target, source];
      }
      const targetEntity = state.schema.entities.find(
        (e) => e.id === relation.targetEntityId,
      );
      if (
        !source?.isPrimaryKey ||
        !targetEntity ||
        (relation.targetColumnId && !target)
      ) {
        state.notify("Sélectionnez une clé primaire et une colonne à relier.");
        return false;
      }
      if (relation.cardinality === "N-N" && !target?.isPrimaryKey) {
        state.notify(
          "Une association N:N relie les clés primaires des deux tables.",
        );
        return false;
      }
      if (
        relation.sourceEntityId === relation.targetEntityId &&
        relation.sourceColumnId === relation.targetColumnId
      ) {
        state.notify("Choisissez deux colonnes différentes.");
        return false;
      }
      if (
        state.schema.relations.some(
          (r) =>
            r.id !== replaceId &&
            ((r.sourceEntityId === relation.sourceEntityId &&
              r.sourceColumnId === relation.sourceColumnId &&
              r.targetEntityId === relation.targetEntityId &&
              r.targetColumnId === relation.targetColumnId &&
              r.cardinality === relation.cardinality) ||
              (r.cardinality !== "N-N" &&
                relation.cardinality !== "N-N" &&
                r.targetEntityId === relation.targetEntityId &&
                r.targetColumnId === relation.targetColumnId)),
        )
      ) {
        state.notify(
          "Cette colonne possède déjà cette référence. Sélectionnez le lien pour le modifier.",
        );
        return false;
      }
      if (!target && targetEntity.attributes.length >= 100) {
        state.notify("Limite de 100 colonnes par table.");
        return false;
      }
      if (!replaceId && state.schema.relations.length >= 2000) return false;
      edit(
        (s) => {
          if (!target) {
            const table = s.entities.find(
              (e) => e.id === relation.targetEntityId,
            )!;
            const parent = s.entities.find(
              (e) => e.id === relation.sourceEntityId,
            )!;
            let i = 1;
            const base = (parent.name + "_" + source!.name).slice(0, 85);
            let name = base;
            while (table.attributes.some((a) => a.name === name))
              name = base + "_ref" + i++;
            const a = freshColumn(name);
            table.attributes.push(a);
            relation.targetColumnId = a.id;
          }
          s.relations = s.relations.filter((r) => r.id !== replaceId);
          s.relations.push({ ...relation, id: replaceId ?? uuid() });
          followTypes(s);
        },
        "",
        replaceId ? "Relation mise à jour." : "Relation créée.",
      );
      return true;
    },
    removeRelation: (id) =>
      edit(
        (s) => {
          s.relations = s.relations.filter((r) => r.id !== id);
        },
        "",
        "Relation retirée. Les colonnes restent disponibles pour un nouveau lien.",
      ),
    patchRelation: (id, patch) =>
      edit((s) => {
        const r = s.relations.find((r) => r.id === id);
        if (r) Object.assign(r, patch);
      }, "relation:" + id),
    cardinality: (id, value) => {
      const r = get().schema.relations.find((r) => r.id === id);
      if (r) get().connect({ ...r, cardinality: value }, id);
    },
  };
});
