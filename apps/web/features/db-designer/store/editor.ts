import { create } from "zustand";
import {
  exampleSchema,
  type Attribute,
  type Relation,
  type Schema,
} from "../model/schema";
interface EditorState {
  schema: Schema;
  dirty: boolean;
  notice: string;
  rename: (name: string) => void;
  replace: (schema: Schema) => void;
  saved: () => void;
  notify: (notice: string) => void;
  addTable: (position: { x: number; y: number }) => string;
  removeTable: (id: string) => void;
  moveTable: (id: string, position: { x: number; y: number }) => void;
  renameTable: (id: string, name: string) => void;
  addColumn: (id: string) => void;
  patchColumn: (tableId: string, id: string, patch: Partial<Attribute>) => void;
  removeColumn: (tableId: string, id: string) => void;
  connect: (relation: Omit<Relation, "id" | "cardinality">) => void;
  removeRelation: (id: string) => void;
  cardinality: (id: string, value: Relation["cardinality"]) => void;
}
const uuid = () => crypto.randomUUID();
export const useEditor = create<EditorState>((set, get) => ({
  schema: exampleSchema(),
  dirty: false,
  notice: "Un exemple pour commencer. Modifiez-le ou créez un projet vide.",
  notify: (notice) => set({ notice }),
  rename: (name) =>
    set((s) => ({ schema: { ...s.schema, name }, dirty: true })),
  replace: (schema) =>
    set({
      schema,
      dirty: false,
      notice: "Projet chargé. Pensez à exporter vos prochaines modifications.",
    }),
  saved: () =>
    set({
      dirty: false,
      notice:
        "Fichier préparé pour téléchargement. Conservez-le pour reprendre votre projet.",
    }),
  addTable: (position) => {
    if (get().schema.entities.length >= 200) {
      get().notify("Limite de 200 tables par projet.");
      return "";
    }
    const id = uuid();
    let index = get().schema.entities.length + 1;
    while (get().schema.entities.some((e) => e.name === `table_${index}`))
      index++;
    set((s) => ({
      dirty: true,
      schema: {
        ...s.schema,
        entities: [
          ...s.schema.entities,
          {
            id,
            name: `table_${index}`,
            position,
            attributes: [
              {
                id: uuid(),
                name: "id",
                type: "UUID",
                isPrimaryKey: true,
                nullable: false,
              },
            ],
          },
        ],
      },
    }));
    return id;
  },
  removeTable: (id) =>
    set((s) => ({
      dirty: true,
      schema: {
        ...s.schema,
        entities: s.schema.entities.filter((e) => e.id !== id),
        relations: s.schema.relations.filter(
          (r) => r.sourceEntityId !== id && r.targetEntityId !== id,
        ),
      },
    })),
  moveTable: (id, position) =>
    set((s) => ({
      dirty: true,
      schema: {
        ...s.schema,
        entities: s.schema.entities.map((e) =>
          e.id === id ? { ...e, position } : e,
        ),
      },
    })),
  renameTable: (id, name) =>
    set((s) => ({
      dirty: true,
      schema: {
        ...s.schema,
        entities: s.schema.entities.map((e) =>
          e.id === id ? { ...e, name } : e,
        ),
      },
    })),
  addColumn: (id) =>
    set((s) => ({
      dirty: true,
      schema: {
        ...s.schema,
        entities: s.schema.entities.map((e) =>
          e.id === id && e.attributes.length < 100
            ? {
                ...e,
                attributes: [
                  ...e.attributes,
                  {
                    id: uuid(),
                    name: `column_${e.attributes.length + 1}`,
                    type: "VARCHAR",
                    nullable: false,
                    isPrimaryKey: false,
                  },
                ],
              }
            : e,
        ),
      },
    })),
  patchColumn: (tableId, id, patch) => {
    const state = get();
    if (
      patch.isPrimaryKey === false &&
      state.schema.relations.some(
        (r) => r.sourceEntityId === tableId && r.sourceColumnId === id,
      )
    ) {
      state.notify(
        "Retirez les relations de cette clé avant de la désactiver.",
      );
      return;
    }
    const incoming = state.schema.relations.some(
      (r) => r.targetEntityId === tableId && r.targetColumnId === id,
    );
    if (incoming && patch.type) return;
    set((s) => {
      const entities = s.schema.entities.map((e) => ({
        ...e,
        attributes: e.attributes.map((a) => {
          if (e.id === tableId && a.id === id) {
            const next = { ...a, ...patch };
            return {
              ...next,
              nullable: next.isPrimaryKey ? false : next.nullable,
            };
          }
          return { ...a };
        }),
      }));
      // Referencing types follow the source key, including chains of references.
      for (let pass = 0; pass < entities.length; pass++)
        for (const relation of s.schema.relations) {
          const source = entities
            .find((e) => e.id === relation.sourceEntityId)
            ?.attributes.find((a) => a.id === relation.sourceColumnId);
          const target = entities
            .find((e) => e.id === relation.targetEntityId)
            ?.attributes.find((a) => a.id === relation.targetColumnId);
          if (source && target)
            target.type = source.type === "SERIAL" ? "INTEGER" : source.type;
        }
      return { dirty: true, schema: { ...s.schema, entities } };
    });
  },
  removeColumn: (tableId, id) =>
    set((s) => ({
      dirty: true,
      schema: {
        ...s.schema,
        entities: s.schema.entities.map((e) =>
          e.id === tableId
            ? { ...e, attributes: e.attributes.filter((a) => a.id !== id) }
            : e,
        ),
        relations: s.schema.relations.filter(
          (r) =>
            !(r.sourceEntityId === tableId && r.sourceColumnId === id) &&
            !(r.targetEntityId === tableId && r.targetColumnId === id),
        ),
      },
    })),
  connect: (relation) => {
    const state = get();
    const source = state.schema.entities
      .find((e) => e.id === relation.sourceEntityId)
      ?.attributes.find((a) => a.id === relation.sourceColumnId);
    const target = state.schema.entities
      .find((e) => e.id === relation.targetEntityId)
      ?.attributes.find((a) => a.id === relation.targetColumnId);
    if (!source?.isPrimaryKey || !target) {
      state.notify(
        "Partez du point droit d’une clé primaire, puis rejoignez le point gauche d’une colonne.",
      );
      return;
    }
    if (
      (relation.sourceEntityId === relation.targetEntityId &&
        relation.sourceColumnId === relation.targetColumnId) ||
      state.schema.relations.some(
        (r) =>
          r.targetEntityId === relation.targetEntityId &&
          r.targetColumnId === relation.targetColumnId,
      )
    ) {
      state.notify(
        "Cette colonne est déjà liée ou la connexion pointe sur elle-même.",
      );
      return;
    }
    if (state.schema.relations.length >= 2000) return;
    set((s) => ({
      dirty: true,
      notice:
        "Relation créée. Cliquez sur son trait pour modifier la cardinalité.",
      schema: {
        ...s.schema,
        relations: [
          ...s.schema.relations,
          { ...relation, id: uuid(), cardinality: "1-N" },
        ],
        entities: s.schema.entities.map((e) =>
          e.id === relation.targetEntityId
            ? {
                ...e,
                attributes: e.attributes.map((a) =>
                  a.id === relation.targetColumnId
                    ? {
                        ...a,
                        type:
                          source.type === "SERIAL" ? "INTEGER" : source.type,
                      }
                    : a,
                ),
              }
            : e,
        ),
      },
    }));
    get().patchColumn(relation.sourceEntityId, relation.sourceColumnId, {});
  },
  removeRelation: (id) =>
    set((s) => ({
      dirty: true,
      schema: {
        ...s.schema,
        relations: s.schema.relations.filter((r) => r.id !== id),
      },
    })),
  cardinality: (id, value) =>
    set((s) => ({
      dirty: true,
      schema: {
        ...s.schema,
        relations: s.schema.relations.map((r) =>
          r.id === id ? { ...r, cardinality: value } : r,
        ),
      },
    })),
}));
