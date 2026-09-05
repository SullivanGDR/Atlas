"use client";
import { Button } from "@atlas/ui";
import { Copy, Plus, Trash2 } from "lucide-react";
import { columnTypes } from "../model/schema";
import { useEditor } from "../store/editor";

export function ColumnEditor({
  tableId,
  columnId,
  onSelectColumn,
  onClose,
}: {
  tableId: string;
  columnId?: string;
  onSelectColumn: (id: string) => void;
  onClose: () => void;
}) {
  const editor = useEditor();
  const table = editor.schema.entities.find((e) => e.id === tableId);
  if (!table) return null;
  const a = table.attributes.find((a) => a.id === columnId);
  const foreign = editor.schema.relations.some(
    (r) =>
      r.cardinality !== "N-N" &&
      r.targetEntityId === tableId &&
      (r.targetColumnId === a?.id ||
        r.columnPairs?.some((p) => p.targetColumnId === a?.id)),
  );
  const patch = (value: Parameters<typeof editor.patchColumn>[2]) => {
    if (a) editor.patchColumn(tableId, a.id, value);
  };
  return (
    <div className="editor-form">
      <label>
        Nom de la table
        <input
          value={table.name}
          maxLength={100}
          onChange={(e) => editor.renameTable(tableId, e.target.value)}
        />
      </label>
      <label>
        Colonne
        <select
          value={a?.id ?? ""}
          onChange={(e) => onSelectColumn(e.target.value)}
        >
          <option value="" disabled>
            Choisir une colonne
          </option>
          {table.attributes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      {a && (
        <>
          <label>
            Nom
            <input
              value={a.name}
              maxLength={100}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <label>
            Type
            <select
              value={a.type}
              disabled={foreign}
              onChange={(e) => patch({ type: e.target.value as typeof a.type })}
            >
              {columnTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          {foreign && (
            <p className="form-hint">
              Type hérité de la clé référencée. Retirez la relation pour le
              modifier.
            </p>
          )}
          {a.type === "VARCHAR" && (
            <label>
              Longueur maximale
              <input
                type="number"
                min={1}
                max={10485760}
                placeholder="255"
                value={a.length ?? ""}
                disabled={foreign}
                onChange={(e) =>
                  patch({
                    length: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </label>
          )}
          {a.type === "NUMERIC" && (
            <div className="form-grid">
              <label>
                Précision
                <input
                  type="number"
                  min={1}
                  max={1000}
                  placeholder="18"
                  value={a.precision ?? ""}
                  disabled={foreign}
                  onChange={(e) =>
                    patch({
                      precision: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </label>
              <label>
                Décimales
                <input
                  type="number"
                  min={0}
                  max={1000}
                  placeholder="2"
                  value={a.scale ?? ""}
                  disabled={foreign}
                  onChange={(e) =>
                    patch({
                      scale: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </label>
            </div>
          )}
          <label className="check-label">
            <input
              type="checkbox"
              checked={a.isPrimaryKey}
              onChange={(e) => patch({ isPrimaryKey: e.target.checked })}
            />
            Clé primaire
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={a.nullable}
              disabled={a.isPrimaryKey}
              onChange={(e) => patch({ nullable: e.target.checked })}
            />
            Nullable
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={a.unique ?? false}
              onChange={(e) => patch({ unique: e.target.checked })}
            />
            Valeur unique
          </label>
          <label>
            Valeur par défaut
            <input
              value={a.defaultValue ?? ""}
              maxLength={500}
              disabled={a.type === "SERIAL"}
              placeholder={
                a.type === "UUID" && a.isPrimaryKey
                  ? "UUID généré automatiquement"
                  : "'texte', 0, false, CURRENT_TIMESTAMP…"
              }
              onChange={(e) =>
                patch({ defaultValue: e.target.value || undefined })
              }
            />
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              editor.removeColumn(tableId, a.id);
            }}
          >
            <Trash2 size={14} />
            Supprimer cette colonne
          </Button>
        </>
      )}
      <div className="panel-divider" />
      <Button variant="outline" onClick={() => editor.addColumn(tableId)}>
        <Plus size={14} />
        Ajouter une colonne
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          editor.duplicateTable(tableId);
          onClose();
        }}
      >
        <Copy size={14} />
        Dupliquer la table
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          editor.removeTable(tableId);
          onClose();
        }}
      >
        <Trash2 size={14} />
        Supprimer la table
      </Button>
    </div>
  );
}
