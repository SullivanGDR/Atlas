"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@atlas/ui";
import type { Schema } from "../model/schema";
import {
  diagramModels,
  renderDiagramImage,
  diagramImageBlob,
  type DiagramModel,
  type ImageFormat,
  type ImagePalette,
} from "../generators/diagram-image";
import { downloadFile, filename } from "../generators/download";

export function ImageExportPanel({ schema }: { schema: Schema }) {
  const [model, setModel] = useState<DiagramModel>("mcd");
  const [format, setFormat] = useState<ImageFormat>("png");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [palette] = useState<ImagePalette>(() => {
    const style = getComputedStyle(document.documentElement);
    const color = (name: string) =>
      style.getPropertyValue("--export-" + name).trim();
    return {
      paper: color("paper"),
      ink: color("ink"),
      muted: color("muted"),
      line: color("line"),
      header: color("header"),
    };
  });
  const result = useMemo(() => {
    try {
      return {
        document: renderDiagramImage(schema, model, palette),
        error: "",
      };
    } catch (error) {
      return {
        document: null,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de préparer cette image.",
      };
    }
  }, [schema, model, palette]);
  const download = async () => {
    if (!result.document) return;
    setBusy(true);
    setStatus("");
    try {
      downloadFile(
        await diagramImageBlob(result.document, format),
        `${filename(schema.name)}-${model.toUpperCase()}.${format}`,
      );
      setStatus(
        `Export ${format.toUpperCase()} prêt. Le téléchargement a été lancé.`,
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Impossible de télécharger cette image.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="image-export">
      <p className="form-hint">
        Une planche prête à partager, avec une disposition automatique
        indépendante du zoom et de la position des tables.
      </p>
      <fieldset disabled={busy}>
        <legend>1. Modèle de données</legend>
        <div className="image-model-options">
          {diagramModels.map((item) => (
            <label key={item.id}>
              <input
                type="radio"
                name="image-model"
                value={item.id}
                checked={model === item.id}
                onChange={() => {
                  setModel(item.id);
                  setStatus("");
                }}
              />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>2. Format du fichier</legend>
        <div className="image-format-options">
          <label>
            <input
              type="radio"
              name="image-format"
              checked={format === "png"}
              onChange={() => {
                setFormat("png");
                setStatus("");
              }}
            />
            <span>
              <strong>PNG</strong>
              <small>Image haute résolution</small>
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="image-format"
              checked={format === "svg"}
              onChange={() => {
                setFormat("svg");
                setStatus("");
              }}
            />
            <span>
              <strong>SVG</strong>
              <small>Vectoriel, net à toute échelle</small>
            </span>
          </label>
        </div>
      </fieldset>
      {result.error ? (
        <p role="alert">{result.error}</p>
      ) : (
        result.document && (
          <div className="image-preview">
            <div className="image-preview-caption">
              <span>Aperçu du document</span>
              <span>
                {result.document.tableCount}{" "}
                {model === "mcd" ? "entités" : "tables"}
              </span>
            </div>
            <div className="image-preview-sheet">
              {/* Native SVG data URI: no external source, optimization or network request. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.document.svg)}`}
                width={result.document.width}
                height={result.document.height}
                alt={`Aperçu ${model.toUpperCase()} — ${schema.name}`}
              />
            </div>
          </div>
        )
      )}
      <div className="image-export-footer">
        <p className="form-hint">
          Fond blanc · Titre du projet · Signature Atlas
          <br />
          Pour un grand schéma, privilégiez le SVG.
        </p>
        <Button
          disabled={busy || !result.document}
          onClick={() => void download()}
        >
          <Download size={16} />
          {busy ? "Préparation…" : `Télécharger le ${format.toUpperCase()}`}
        </Button>
      </div>
      {status && (
        <p className="form-hint" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
