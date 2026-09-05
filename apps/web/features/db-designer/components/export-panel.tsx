"use client";
import { useMemo, useState } from "react";
import { Button } from "@atlas/ui";
import { ArrowDownToLine, Copy, FileCode2 } from "lucide-react";
import type { Schema } from "../model/schema";
import { serializeProject } from "../model/schema";
import { generateFastAPI } from "../generators/fastapi";
import { generateSQL } from "../generators/sql";
import { downloadFile, filename } from "../generators/download";

export function ExportPanel({ schema }: { schema: Schema }) {
  const [format, setFormat] = useState<"fastapi" | "sql">("fastapi");
  const [selected, setSelected] = useState("backend/README.md");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const result = useMemo(() => {
    try {
      return {
        files:
          format === "fastapi"
            ? generateFastAPI(schema)
            : { "schema.sql": generateSQL(schema) },
        error: "",
      };
    } catch (error) {
      return {
        files: {} as Record<string, string>,
        error:
          error instanceof Error ? error.message : "Génération impossible.",
      };
    }
  }, [schema, format]);
  const paths = Object.keys(result.files);
  const active = selected in result.files ? selected : (paths[0] ?? "");
  return (
    <div className="export-workspace">
      <div className="export-options">
        <div className="view-switch">
          <button
            onClick={() => setFormat("fastapi")}
            aria-pressed={format === "fastapi"}
          >
            FastAPI + PostgreSQL
          </button>
          <button
            onClick={() => setFormat("sql")}
            aria-pressed={format === "sql"}
          >
            SQL
          </button>
        </div>
        <span>{paths.length} fichiers</span>
      </div>
      {result.error ? (
        <p role="alert" className="form-error">
          {result.error}
        </p>
      ) : (
        <div className="code-workspace">
          <nav aria-label="Fichiers générés">
            {paths.map((path) => (
              <button
                key={path}
                className={path === active ? "selected-file" : ""}
                onClick={() => setSelected(path)}
              >
                <FileCode2 size={13} />
                {path.replace("backend/", "")}
              </button>
            ))}
          </nav>
          <div className="code-view">
            <header>
              <span>{active}</span>
              <button
                aria-label="Copier le fichier"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      result.files[active] ?? "",
                    );
                    setNotice("Fichier copié.");
                  } catch {
                    setNotice("Copie indisponible. Téléchargez les fichiers.");
                  }
                }}
              >
                <Copy size={14} />
              </button>
            </header>
            <pre tabIndex={0}>
              <code>{result.files[active]}</code>
            </pre>
          </div>
        </div>
      )}
      <footer className="export-footer">
        <p role="status">
          {notice ||
            "Le MLD inclut les clés étrangères et les tables de jointure."}
        </p>
        <Button
          disabled={busy || !!result.error}
          onClick={async () => {
            setBusy(true);
            setNotice("");
            try {
              if (format === "sql")
                downloadFile(
                  new Blob([result.files["schema.sql"]!], {
                    type: "text/plain",
                  }),
                  filename(schema.name) + ".sql",
                );
              else {
                const response = await fetch("/api/tools/athena/export", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: serializeProject(schema),
                });
                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || "Export impossible.");
                }
                downloadFile(
                  await response.blob(),
                  filename(schema.name) + "-fastapi.zip",
                );
              }
              setNotice("Téléchargement préparé.");
            } catch (error) {
              setNotice(
                error instanceof Error ? error.message : "Export impossible.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <ArrowDownToLine size={15} />
          {busy
            ? "Génération…"
            : format === "fastapi"
              ? "Télécharger le ZIP"
              : "Télécharger le SQL"}
        </Button>
      </footer>
    </div>
  );
}
