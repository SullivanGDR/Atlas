"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  useReactFlow,
  useNodesInitialized,
  type Edge,
} from "@xyflow/react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Braces,
  Check,
  FilePlus2,
  KeyRound,
  Link2,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@atlas/ui";
import { useEditor } from "../store/editor";
import { parseProject, serializeProject, type Relation } from "../model/schema";
import { TableNode, type TableFlowNode } from "./table-node";
import "@xyflow/react/dist/style.css";
import "./schematic.css";
const nodeTypes = { table: TableNode };
export function Athena() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
function Editor() {
  const schema = useEditor((s) => s.schema);
  const dirty = useEditor((s) => s.dirty);
  const notice = useEditor((s) => s.notice);
  const editor = useEditor();
  const { screenToFlowPosition, fitView, setCenter, getZoom } =
    useReactFlow<TableFlowNode>();
  const initialized = useNodesInitialized();
  const initialFit = useRef(false);
  useEffect(() => {
    if (initialized && !initialFit.current) {
      initialFit.current = true;
      void fitView({ padding: 0.18, maxZoom: 1, duration: 200 });
    }
  }, [initialized, fitView]);
  const canvas = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedTable, selectTable] = useState<string | null>(null);
  const [selectedRelation, selectRelation] = useState<string | null>(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    flow: { x: number; y: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const nodes = useMemo<TableFlowNode[]>(
    () =>
      schema.entities.map((entity) => ({
        id: entity.id,
        type: "table",
        position: entity.position,
        dragHandle: ".table-drag",
        selected: selectedTable === entity.id,
        data: {
          entity,
          foreignColumns: schema.relations
            .filter((r) => r.targetEntityId === entity.id)
            .map((r) => r.targetColumnId),
        },
      })),
    [schema, selectedTable],
  );
  const edges = useMemo<Edge[]>(
    () =>
      schema.relations.map((r) => ({
        id: r.id,
        source: r.sourceEntityId,
        target: r.targetEntityId,
        sourceHandle: r.sourceColumnId,
        targetHandle: r.targetColumnId,
        type: "smoothstep",
        label: r.cardinality.replace("-", " : "),
        selected: selectedRelation === r.id,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: {
          strokeWidth: selectedRelation === r.id ? 2.5 : 1.5,
          stroke: "var(--accent)",
        },
        labelStyle: {
          fill: "var(--foreground)",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
        },
        labelBgStyle: { fill: "var(--surface)" },
        labelBgPadding: [9, 5],
        labelBgBorderRadius: 4,
      })),
    [schema.relations, selectedRelation],
  );
  const activeRelation = schema.relations.find(
    (r) => r.id === selectedRelation,
  );
  const download = useCallback(() => {
    try {
      const current = useEditor.getState();
      const blob = new Blob([serializeProject(current.schema)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${current.schema.name.replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 80) || "schema"}.atlas.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      current.saved();
    } catch {
      useEditor
        .getState()
        .notify(
          "Export impossible : vérifiez le nom du projet et les relations.",
        );
    }
  }, []);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (useEditor.getState().dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        download();
      }
      if (event.key === "Escape") {
        setMenu(null);
        setExplorerOpen(false);
      }
    };
    const close = () => setMenu(null);
    window.addEventListener("beforeunload", unload);
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", close);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", close);
    };
  }, [download]);
  const addTable = (position?: { x: number; y: number }) => {
    const bounds = canvas.current?.getBoundingClientRect();
    const point =
      position ??
      screenToFlowPosition({
        x: (bounds?.left ?? 0) + (bounds?.width ?? 900) / 2 - 160,
        y: (bounds?.top ?? 0) + (bounds?.height ?? 600) / 2 - 100,
      });
    selectTable(editor.addTable(point));
    selectRelation(null);
    setMenu(null);
  };
  const allowReplace = () =>
    !useEditor.getState().dirty ||
    window.confirm(
      "Ce projet contient des modifications non exportées. Les remplacer sans les exporter ?",
    );
  const importFile = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Fichier trop volumineux (5 Mo maximum).");
      const imported = parseProject(JSON.parse(await file.text()));
      if (!allowReplace()) return;
      editor.replace(imported);
      selectTable(null);
      selectRelation(null);
      setMenu(null);
      setTimeout(
        () => void fitView({ padding: 0.2, duration: 350, maxZoom: 1 }),
        80,
      );
    } catch (error) {
      editor.notify(
        error instanceof SyntaxError
          ? "Ce fichier ne contient pas un JSON valide."
          : error instanceof Error && error.name !== "ZodError"
            ? error.message
            : "Format incompatible. Ouvrez un fichier .atlas.json exporté par Athena (version 1).",
      );
    } finally {
      setLoading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  return (
    <div className="schematic">
      <div className="schematic-toolbar">
        <Button
          variant="ghost"
          className="explorer-toggle"
          aria-label={
            explorerOpen
              ? "Fermer la liste des tables"
              : "Ouvrir la liste des tables"
          }
          aria-expanded={explorerOpen}
          onClick={() => setExplorerOpen((open) => !open)}
        >
          {explorerOpen ? (
            <PanelLeftClose size={17} />
          ) : (
            <PanelLeftOpen size={17} />
          )}
          <span>Tables</span>
          <small>{schema.entities.length}</small>
        </Button>
        <div className="schematic-identity">
          <div className="tool-symbol">
            <Braces size={21} />
          </div>
          <div>
            <h1>
              Athena <span>V.01</span>
            </h1>
            <p>Vos données prennent forme.</p>
          </div>
        </div>
        <div className="project-title">
          <input
            aria-label="Nom du projet"
            maxLength={100}
            value={schema.name}
            placeholder="Nom du projet"
            onChange={(e) => editor.rename(e.target.value)}
          />
        </div>
        <div className="file-actions">
          <Button
            variant="ghost"
            onClick={() => {
              if (allowReplace()) {
                editor.replace({
                  id: crypto.randomUUID(),
                  name: "Sans titre",
                  entities: [],
                  relations: [],
                });
                selectTable(null);
                selectRelation(null);
              }
            }}
            title="Nouveau projet"
            aria-label="Nouveau projet"
          >
            <FilePlus2 size={16} />
          </Button>
          <Button
            variant="ghost"
            disabled={loading}
            aria-label="Importer un projet"
            title="Importer un projet"
            onClick={() => fileInput.current?.click()}
          >
            <ArrowUpFromLine size={15} />
            <span>Importer</span>
          </Button>
          <Button
            variant="outline"
            onClick={download}
            aria-label="Exporter le projet"
            title="Exporter le projet"
          >
            <ArrowDownToLine size={15} />
            <span>Exporter</span>
          </Button>
          <Button onClick={() => addTable()} aria-label="Ajouter une table">
            <Plus size={16} />
            <span>Table</span>
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.atlas.json,application/json"
          hidden
          onChange={(e) => void importFile(e.target.files?.[0])}
        />
      </div>
      <div className="schematic-body">
        {explorerOpen && (
          <button
            className="explorer-scrim"
            aria-label="Fermer la liste des tables"
            onClick={() => setExplorerOpen(false)}
          />
        )}
        <aside
          className={`schema-explorer ${explorerOpen ? "is-open" : ""}`}
          aria-label="Tables du schéma"
          aria-hidden={!explorerOpen}
          inert={!explorerOpen}
        >
          <div className="explorer-heading">
            <span>EXPLORATEUR</span>
            <button
              className="icon-action"
              aria-label="Fermer la liste des tables"
              onClick={() => setExplorerOpen(false)}
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
          <div className="explorer-section">
            Tables{" "}
            <span>{schema.entities.length.toString().padStart(2, "0")}</span>
          </div>
          <div className="table-list">
            {schema.entities.map((e) => (
              <button
                key={e.id}
                className={selectedTable === e.id ? "active" : ""}
                onClick={() => {
                  selectTable(e.id);
                  selectRelation(null);
                  setExplorerOpen(false);
                  void setCenter(e.position.x + 170, e.position.y + 90, {
                    zoom: Math.max(getZoom(), 0.85),
                    duration: 300,
                  });
                }}
              >
                <Table2 size={14} />
                <span>{e.name || "Sans nom"}</span>
                <small>{e.attributes.length}</small>
              </button>
            ))}
          </div>
          <button className="explorer-add" onClick={() => addTable()}>
            <Plus size={14} /> Nouvelle table
          </button>
          <div className="explorer-note">
            <div className="note-icon">
              <Braces size={18} />
            </div>
            <strong>
              Votre schéma.
              <br />
              Votre fichier.
            </strong>
            <p>
              Aucun compte, aucun serveur de stockage. Exportez votre projet
              pour le retrouver plus tard.
            </p>
            <span>.atlas.json</span>
          </div>
        </aside>
        <div className="schema-canvas" ref={canvas}>
          <ReactFlow<TableFlowNode>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={0.25}
            maxZoom={1.6}
            deleteKeyCode={["Backspace", "Delete"]}
            snapToGrid
            snapGrid={[16, 16]}
            onNodesChange={(changes) => {
              for (const change of changes) {
                if (change.type === "position" && change.position)
                  editor.moveTable(change.id, change.position);
                if (change.type === "remove") editor.removeTable(change.id);
                if (change.type === "select" && change.selected)
                  selectTable(change.id);
              }
            }}
            onEdgesChange={(changes) => {
              for (const change of changes)
                if (change.type === "remove") editor.removeRelation(change.id);
            }}
            onConnect={(c) => {
              if (c.sourceHandle && c.targetHandle)
                editor.connect({
                  sourceEntityId: c.source,
                  sourceColumnId: c.sourceHandle,
                  targetEntityId: c.target,
                  targetColumnId: c.targetHandle,
                });
            }}
            onNodeClick={(_, node) => {
              selectTable(node.id);
              selectRelation(null);
              setMenu(null);
            }}
            onEdgeClick={(_, edge) => {
              selectRelation(edge.id);
              selectTable(null);
              setMenu(null);
            }}
            onPaneClick={() => {
              selectTable(null);
              selectRelation(null);
              setMenu(null);
            }}
            onPaneContextMenu={(event) => {
              event.preventDefault();
              const bounds = canvas.current!.getBoundingClientRect();
              setMenu({
                x: Math.min(event.clientX - bounds.left, bounds.width - 220),
                y: Math.min(event.clientY - bounds.top, bounds.height - 72),
                flow: screenToFlowPosition({
                  x: event.clientX,
                  y: event.clientY,
                }),
              });
            }}
          >
            <Background gap={24} size={1} color="var(--canvas-dot)" />
            <Panel position="top-left">
              <div className="canvas-caption">
                SCHÉMA RELATIONNEL <span>/</span> ESPACE LIBRE
              </div>
            </Panel>
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor="var(--muted-surface)"
              nodeStrokeColor="var(--border)"
              maskColor="var(--canvas-mask)"
              pannable
              zoomable
            />
            {schema.entities.length === 0 && (
              <Panel position="top-center" className="empty-canvas">
                <Table2 size={36} strokeWidth={1} />
                <h2>Tout commence par une table.</h2>
                <p>
                  Ajoutez votre première entité, puis donnez une structure à vos
                  idées.
                </p>
                <Button onClick={() => addTable()}>
                  <Plus size={16} />
                  Créer une table
                </Button>
                <small>Ou faites un clic droit sur le canvas</small>
              </Panel>
            )}
          </ReactFlow>
          {menu && (
            <div
              className="canvas-menu"
              role="menu"
              aria-label="Actions du canvas"
              style={{ left: Math.max(8, menu.x), top: Math.max(8, menu.y) }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                role="menuitem"
                autoFocus
                onClick={() => addTable(menu.flow)}
              >
                <Plus size={16} /> Créer une table <span>+</span>
              </button>
            </div>
          )}
          {activeRelation && (
            <section className="relation-panel">
              <div>
                <Link2 size={16} />
                <strong>Relation</strong>
                <button
                  className="icon-action"
                  aria-label="Fermer les propriétés"
                  onClick={() => selectRelation(null)}
                >
                  <X size={15} />
                </button>
              </div>
              <p>
                {
                  schema.entities.find(
                    (e) => e.id === activeRelation.sourceEntityId,
                  )?.name
                }{" "}
                <span>→</span>{" "}
                {
                  schema.entities.find(
                    (e) => e.id === activeRelation.targetEntityId,
                  )?.name
                }
              </p>
              <label>
                Cardinalité
                <select
                  value={activeRelation.cardinality}
                  onChange={(e) =>
                    editor.cardinality(
                      activeRelation.id,
                      e.target.value as Relation["cardinality"],
                    )
                  }
                >
                  <option value="1-1">Un à un · 1:1</option>
                  <option value="1-N">Un à plusieurs · 1:N</option>
                  <option value="N-N">Plusieurs à plusieurs · N:N</option>
                </select>
              </label>
              <Button
                variant="ghost"
                onClick={() => {
                  editor.removeRelation(activeRelation.id);
                  selectRelation(null);
                }}
              >
                <Trash2 size={14} />
                Supprimer le lien
              </Button>
            </section>
          )}
          <div className="canvas-help">
            <MousePointer2 size={13} />
            <span>Glisser pour déplacer</span>
            <span className="help-divider" />
            <KeyRound size={13} />
            <span>Relier une clé à une colonne</span>
          </div>
        </div>
      </div>
      <footer className="schematic-status">
        <span>Local uniquement</span>
        <span>
          {schema.entities.length} tables{" "}
          <span className="status-separator">/</span> {schema.relations.length}{" "}
          relations
        </span>
        <p role="status" aria-live="polite">
          {notice}
        </p>
        <span className="export-status">
          {dirty ? (
            "À exporter"
          ) : (
            <>
              <Check size={12} />
              Prêt
            </>
          )}
        </span>
      </footer>
    </div>
  );
}
