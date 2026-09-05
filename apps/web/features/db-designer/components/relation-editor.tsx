"use client";
import { useState } from "react";
import { Button } from "@atlas/ui";
import { ArrowRight, Trash2 } from "lucide-react";
import { useEditor, type ConnectionDraft } from "../store/editor";
import type { Relation } from "../model/schema";

export function RelationEditor({
  relation,
  onClose,
}: {
  relation?: Relation;
  onClose: () => void;
}) {
  const editor = useEditor();
  const [draft, setDraft] = useState<ConnectionDraft>(() =>
    relation
      ? { ...relation }
      : {
          sourceEntityId: editor.schema.entities[0]?.id ?? "",
          sourceColumnId:
            editor.schema.entities[0]?.attributes.find((a) => a.isPrimaryKey)
              ?.id ?? "",
          targetEntityId: editor.schema.entities[1]?.id ?? "",
          targetColumnId: "",
          cardinality: "1-N",
          onDelete: "RESTRICT",
          name: "",
        },
  );
  const [error, setError] = useState("");
  const source = editor.schema.entities.find(
    (e) => e.id === draft.sourceEntityId,
  );
  const target = editor.schema.entities.find(
    (e) => e.id === draft.targetEntityId,
  );
  const patch = (value: Partial<ConnectionDraft>) =>
    setDraft((d) => ({ ...d, ...value }));
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (editor.connect(draft, relation?.id)) onClose();
        else setError(useEditor.getState().notice);
      }}
    >
      <p className="form-hint">
        La clé de la table de départ est référencée dans la table d’arrivée.
      </p>
      <label>
        Table de départ
        <select
          required
          value={draft.sourceEntityId}
          onChange={(e) => {
            const t = editor.schema.entities.find(
              (t) => t.id === e.target.value,
            );
            patch({
              sourceEntityId: e.target.value,
              sourceColumnId:
                t?.attributes.find((a) => a.isPrimaryKey)?.id ?? "",
            });
          }}
        >
          <option value="" disabled>
            Choisir une table
          </option>
          {editor.schema.entities.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Clé primaire
        <select
          required
          value={draft.sourceColumnId}
          onChange={(e) => patch({ sourceColumnId: e.target.value })}
        >
          <option value="" disabled>
            Choisir une clé
          </option>
          {source?.attributes
            .filter((a) => a.isPrimaryKey)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.type}
              </option>
            ))}
        </select>
      </label>
      <label>
        Cardinalité
        <select
          value={draft.cardinality}
          onChange={(e) => {
            const cardinality = e.target.value as Relation["cardinality"];
            patch({
              cardinality,
              targetColumnId:
                cardinality === "N-N"
                  ? (target?.attributes.find((a) => a.isPrimaryKey)?.id ?? "")
                  : draft.targetColumnId,
              onDelete: cardinality === "N-N" ? "CASCADE" : "RESTRICT",
            });
          }}
        >
          <option value="1-N">Un à plusieurs · 1:N</option>
          <option value="1-1">Un à un · 1:1</option>
          <option value="N-N">Plusieurs à plusieurs · N:N</option>
        </select>
      </label>
      <div className="form-direction">
        <ArrowRight size={16} />
      </div>
      <label>
        Table d’arrivée
        <select
          required
          value={draft.targetEntityId}
          onChange={(e) => {
            const t = editor.schema.entities.find(
              (t) => t.id === e.target.value,
            );
            patch({
              targetEntityId: e.target.value,
              targetColumnId:
                draft.cardinality === "N-N"
                  ? (t?.attributes.find((a) => a.isPrimaryKey)?.id ?? "")
                  : "",
            });
          }}
        >
          <option value="" disabled>
            Choisir une table
          </option>
          {editor.schema.entities.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {draft.cardinality === "N-N"
          ? "Clé primaire d’arrivée"
          : "Colonne étrangère"}
        <select
          value={draft.targetColumnId}
          required={draft.cardinality === "N-N"}
          onChange={(e) => patch({ targetColumnId: e.target.value })}
        >
          {draft.cardinality !== "N-N" ? (
            <option value="">Créer automatiquement la colonne</option>
          ) : (
            <option value="" disabled>
              Choisir une clé
            </option>
          )}
          {target?.attributes
            .filter((a) => draft.cardinality !== "N-N" || a.isPrimaryKey)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.type}
              </option>
            ))}
        </select>
      </label>
      <label>
        {draft.cardinality === "N-N"
          ? "Nom de la table de jointure"
          : "Nom de la relation"}
        <input
          maxLength={100}
          value={draft.name ?? ""}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder={
            draft.cardinality === "N-N" ? "Généré automatiquement" : "Optionnel"
          }
        />
      </label>
      <label>
        À la suppression de la ligne référencée
        <select
          value={draft.onDelete ?? "RESTRICT"}
          onChange={(e) =>
            patch({ onDelete: e.target.value as Relation["onDelete"] })
          }
        >
          <option value="RESTRICT">Bloquer · RESTRICT</option>
          <option value="CASCADE">Supprimer les dépendances · CASCADE</option>
          {draft.cardinality !== "N-N" && (
            <option value="SET NULL">Vider la référence · SET NULL</option>
          )}
        </select>
      </label>
      {draft.cardinality === "N-N" && (
        <p className="form-hint">
          Le MLD et les exports créent une table de jointure avec une clé
          primaire composite.
        </p>
      )}
      {draft.onDelete === "SET NULL" && (
        <p className="form-hint">
          Activez « Nullable » sur la colonne d’arrivée avant la génération.
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-actions">
        {relation && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              editor.removeRelation(relation.id);
              onClose();
            }}
          >
            <Trash2 size={14} />
            Supprimer
          </Button>
        )}
        <Button type="submit">
          {relation ? "Appliquer" : "Créer la relation"}
        </Button>
      </div>
    </form>
  );
}
