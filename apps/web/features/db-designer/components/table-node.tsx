"use client";
import { useEffect } from "react";
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { GripVertical, KeyRound, Link2, Plus, Trash2, X } from "lucide-react";
import { columnTypes, type Entity } from "../model/schema";
import { useEditor } from "../store/editor";
export type TableFlowNode = Node<
  { entity: Entity; foreignColumns: string[] },
  "table"
>;
export function TableNode({ id, data, selected }: NodeProps<TableFlowNode>) {
  const { entity, foreignColumns } = data;
  const update = useUpdateNodeInternals();
  const rename = useEditor((s) => s.renameTable);
  const add = useEditor((s) => s.addColumn);
  const patch = useEditor((s) => s.patchColumn);
  const remove = useEditor((s) => s.removeColumn);
  const removeTable = useEditor((s) => s.removeTable);
  useEffect(() => {
    update(id);
  }, [id, entity.attributes.length, update]);
  return (
    <section
      className={`schema-table ${selected ? "is-selected" : ""}`}
      aria-label={`Table ${entity.name || "sans nom"}`}
    >
      <header className="table-drag">
        <GripVertical size={14} className="table-grip" />
        <input
          className="nodrag nopan table-name"
          aria-label="Nom de la table"
          value={entity.name}
          maxLength={100}
          placeholder="nom_table"
          onChange={(e) => rename(id, e.target.value)}
        />
        <span className="table-count">{entity.attributes.length}</span>
        <button
          className="nodrag icon-action"
          aria-label={`Supprimer la table ${entity.name}`}
          onClick={() => removeTable(id)}
        >
          <Trash2 size={14} />
        </button>
      </header>
      <div className="column-legend">
        <span>CLÉ</span>
        <span>COLONNE</span>
        <span>TYPE</span>
        <span title="Nullable">NUL</span>
      </div>
      {entity.attributes.map((a) => (
        <div className="schema-column" key={a.id}>
          <Handle
            type="target"
            position={Position.Left}
            id={a.id}
            aria-label={`Relier vers ${entity.name}.${a.name}`}
          />
          <button
            className={`nodrag nopan key-toggle ${a.isPrimaryKey ? "is-key" : ""}`}
            aria-label={`Clé primaire ${entity.name}.${a.name}`}
            aria-pressed={a.isPrimaryKey}
            title={
              a.isPrimaryKey ? "Clé primaire" : "Définir comme clé primaire"
            }
            onClick={() => patch(id, a.id, { isPrimaryKey: !a.isPrimaryKey })}
          >
            {a.isPrimaryKey ? (
              <KeyRound size={13} />
            ) : foreignColumns.includes(a.id) ? (
              <Link2 size={13} />
            ) : (
              <span className="key-dot" />
            )}
          </button>
          <input
            className="nodrag nopan field-name"
            aria-label={`Nom de colonne ${a.name}`}
            placeholder="colonne"
            maxLength={100}
            value={a.name}
            onChange={(e) => patch(id, a.id, { name: e.target.value })}
          />
          <select
            className="nodrag nopan nowheel field-type"
            aria-label={`Type de ${a.name}`}
            value={a.type}
            disabled={foreignColumns.includes(a.id)}
            onChange={(e) =>
              patch(id, a.id, { type: e.target.value as typeof a.type })
            }
          >
            {columnTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            className="nodrag nopan nullable"
            type="checkbox"
            aria-label={`Nullable ${a.name}`}
            title="Autoriser NULL"
            checked={a.nullable}
            disabled={a.isPrimaryKey}
            onChange={(e) => patch(id, a.id, { nullable: e.target.checked })}
          />
          <button
            className="nodrag nopan icon-action remove-column"
            aria-label={`Supprimer la colonne ${a.name}`}
            onClick={() => remove(id, a.id)}
          >
            <X size={12} />
          </button>
          <Handle
            type="source"
            position={Position.Right}
            id={a.id}
            isConnectable={a.isPrimaryKey}
            className={a.isPrimaryKey ? "primary-port" : "inactive-port"}
            aria-label={`Relier depuis ${entity.name}.${a.name}`}
          />
        </div>
      ))}
      <button
        className="nodrag nopan add-column"
        onClick={() => add(id)}
        disabled={entity.attributes.length >= 100}
      >
        <Plus size={14} /> Ajouter une colonne
      </button>
    </section>
  );
}
