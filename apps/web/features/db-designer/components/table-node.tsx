"use client";
import { useEffect } from "react";
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  GripVertical,
  KeyRound,
  Link2,
  Plus,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import { columnTypes, type Entity } from "../model/schema";
import { useEditor } from "../store/editor";
export type TableFlowNode = Node<
  {
    entity: Entity;
    foreignColumns: string[];
    readOnly?: boolean;
    conceptual?: boolean;
    onEdit?: (tableId: string, columnId?: string) => void;
  },
  "table"
>;

export function TableNode({ id, data, selected }: NodeProps<TableFlowNode>) {
  const { entity, foreignColumns, readOnly, conceptual, onEdit } = data;
  const update = useUpdateNodeInternals();
  const editor = useEditor();
  const shape = entity.attributes
    .map(
      (a) => a.id + ":" + a.isPrimaryKey + ":" + foreignColumns.includes(a.id),
    )
    .join("|");
  useEffect(() => {
    update(id);
  }, [id, shape, update, conceptual]);
  return (
    <section
      className={"schema-table" + (selected ? " is-selected" : "")}
      aria-label={"Table " + (entity.name || "sans nom")}
    >
      <header className="table-drag">
        {conceptual &&
          [Position.Left, Position.Right].map((side) => (
            <Handle
              key={side}
              type="source"
              position={side}
              id={"entity:" + side}
              isConnectable={false}
              className="entity-port"
            />
          ))}
        {readOnly ? (
          <Table2 size={15} />
        ) : (
          <GripVertical size={15} className="table-grip" />
        )}
        <input
          className="nodrag nopan table-name"
          aria-label="Nom de la table"
          value={entity.name}
          maxLength={100}
          placeholder="nom_table"
          readOnly={readOnly}
          onChange={(e) => editor.renameTable(id, e.target.value)}
        />
        <span className="table-count">{entity.attributes.length}</span>
        {!readOnly && (
          <button
            className="nodrag nopan icon-action export-hidden"
            aria-label={"Propriétés de " + entity.name}
            title="Propriétés de la table"
            onClick={() => onEdit?.(id)}
          >
            <SlidersHorizontal size={15} />
          </button>
        )}
      </header>
      <div className="column-legend">
        <span>CLÉ</span>
        <span>COLONNE</span>
        <span>TYPE</span>
        <span />
      </div>
      {entity.attributes.map((a) => (
        <div className="schema-column" key={a.id}>
          {!conceptual &&
            [Position.Left, Position.Right].map((side) => (
              <Handle
                key={side}
                type="source"
                position={side}
                id={a.id + ":" + side}
                isConnectable={!readOnly}
                className={
                  "column-port " + (a.isPrimaryKey ? "primary-port" : "")
                }
                aria-label={
                  "Connecter " + entity.name + "." + a.name + " (" + side + ")"
                }
                title={
                  a.isPrimaryKey
                    ? "Clé primaire · cliquez ou glissez pour relier"
                    : "Colonne · cliquez ou glissez pour relier"
                }
              />
            ))}
          <button
            className="nodrag nopan key-toggle"
            aria-label={"Clé primaire " + entity.name + "." + a.name}
            aria-pressed={a.isPrimaryKey}
            disabled={readOnly}
            title={
              a.isPrimaryKey
                ? "Retirer la clé primaire"
                : "Définir comme clé primaire"
            }
            onClick={() =>
              editor.patchColumn(id, a.id, { isPrimaryKey: !a.isPrimaryKey })
            }
          >
            {a.isPrimaryKey ? (
              <KeyRound size={14} />
            ) : foreignColumns.includes(a.id) ? (
              <Link2 size={14} />
            ) : (
              <span className="key-placeholder">—</span>
            )}
          </button>
          <div className="field-name-wrap">
            <input
              className="nodrag nopan field-name"
              aria-label={"Nom de colonne " + a.name}
              placeholder="colonne"
              maxLength={100}
              value={a.name}
              readOnly={readOnly}
              onChange={(e) =>
                editor.patchColumn(id, a.id, { name: e.target.value })
              }
            />
            {a.unique && (
              <span className="constraint-label" title="Valeur unique">
                UQ
              </span>
            )}
            {!a.nullable && !a.isPrimaryKey && (
              <span className="required-mark" title="Obligatoire">
                *
              </span>
            )}
          </div>
          <select
            className="nodrag nopan nowheel field-type"
            aria-label={"Type de " + a.name}
            value={a.type}
            disabled={readOnly || foreignColumns.includes(a.id)}
            onChange={(e) =>
              editor.patchColumn(id, a.id, {
                type: e.target.value as typeof a.type,
              })
            }
          >
            {columnTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {!readOnly && (
            <button
              className="nodrag nopan icon-action column-settings export-hidden"
              title="Contraintes et propriétés"
              aria-label={"Propriétés de " + a.name}
              onClick={() => onEdit?.(id, a.id)}
            >
              <SlidersHorizontal size={13} />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button
          className="nodrag nopan add-column export-hidden"
          onClick={() => editor.addColumn(id)}
          disabled={entity.attributes.length >= 100}
        >
          <Plus size={14} />
          Ajouter une colonne
        </button>
      )}
    </section>
  );
}
