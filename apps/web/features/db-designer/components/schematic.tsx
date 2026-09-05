"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionMode,
  useReactFlow,
  useNodesInitialized,
  getNodesBounds,
  getViewportForBounds,
  type Edge,
  type Connection,
} from "@xyflow/react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Braces,
  Code2,
  Copy,
  FilePlus2,
  FolderOpen,
  History,
  ImageDown,
  LayoutGrid,
  Link2,
  PanelLeftOpen,
  Plus,
  Redo2,
  Share2,
  Table2,
  Undo2,
} from "lucide-react";
import { Button, Modal } from "@atlas/ui";
import { useEditor } from "../store/editor";
import { parseProject, serializeProject, type Schema } from "../model/schema";
import { decodeShare, encodeShare } from "../model/share";
import { mcdToMld } from "../transforms/mcd-to-mld";
import { downloadFile, filename } from "../generators/download";
import { TableNode, type TableFlowNode } from "./table-node";
import { RelationEditor } from "./relation-editor";
import { ColumnEditor } from "./column-editor";
import { ExportPanel } from "./export-panel";
import "@xyflow/react/dist/style.css";
import "./schematic.css";

const nodeTypes = { table: TableNode };
type View = "editor" | "mcd" | "mld";
type Inspector =
  | { kind: "table"; id: string; column?: string }
  | { kind: "relation"; id?: string }
  | null;
const handleColumn = (handle: string | null | undefined) =>
  handle?.replace(/:(left|right)$/, "") ?? "";
const message = (error: unknown) =>
  error instanceof Error && error.name !== "ZodError"
    ? error.message
    : "Fichier de projet invalide.";

export function Athena() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
function Editor() {
  const editor = useEditor();
  const { schema, dirty, readOnly, notice } = editor;
  const { screenToFlowPosition, fitView, setCenter, getZoom, getNodes } =
    useReactFlow<TableFlowNode>();
  const initialized = useNodesInitialized();
  const initialFit = useRef(false);
  const canvas = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedTable, selectTable] = useState<string | null>(null);
  const [selectedRelation, selectRelation] = useState<string | null>(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [inspector, setInspector] = useState<Inspector>(null);
  const [view, setView] = useState<View>("editor");
  const [dialog, setDialog] = useState<"export" | "history" | "share" | null>(
    null,
  );
  const [shareLink, setShareLink] = useState("");
  const [snapshotName, setSnapshotName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    flow: { x: number; y: number };
  } | null>(null);
  const locked = readOnly || view !== "editor";
  useEffect(() => {
    if (initialized && !initialFit.current) {
      initialFit.current = true;
      void fitView({ padding: 0.18, maxZoom: 1, duration: 200 });
    }
  }, [initialized, fitView]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const load = (event?: HashChangeEvent) => {
      if (!window.location.hash.startsWith("#athena=")) return;
      try {
        const shared = decodeShare(window.location.hash.slice(8));
        if (
          event &&
          useEditor.getState().dirty &&
          !window.confirm(
            "Ouvrir ce partage sans exporter les modifications en cours ?",
          )
        ) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + new URL(event.oldURL).hash,
          );
          return;
        }
        useEditor.getState().replace(shared, true);
        initialFit.current = false;
        timer = setTimeout(
          () => void fitView({ padding: 0.18, maxZoom: 1 }),
          100,
        );
      } catch (error) {
        useEditor.getState().notify(message(error));
      }
    };
    load();
    window.addEventListener("hashchange", load);
    return () => {
      window.removeEventListener("hashchange", load);
      clearTimeout(timer);
    };
  }, [fitView]);
  const download = useCallback(() => {
    const s = useEditor.getState();
    try {
      downloadFile(
        new Blob([serializeProject(s.schema)], { type: "application/json" }),
        filename(s.schema.name) + ".atlas.json",
      );
      s.saved();
    } catch (error) {
      s.notify(message(error));
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
      const typing =
        event.target instanceof HTMLElement &&
        (["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName) ||
          event.target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        download();
      }
      if (!typing && !readOnly && (event.ctrlKey || event.metaKey)) {
        if (event.key.toLowerCase() === "z") {
          event.preventDefault();
          if (event.shiftKey) useEditor.getState().redo();
          else useEditor.getState().undo();
        }
        if (event.key.toLowerCase() === "y") {
          event.preventDefault();
          useEditor.getState().redo();
        }
      }
      if (event.key === "Escape") {
        setMenu(null);
        setExplorerOpen(false);
        setInspector(null);
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
  }, [download, readOnly]);
  const projection = useMemo(() => {
    try {
      if (view === "mld")
        return { schema: mcdToMld(schema) as Schema, error: "" };
      if (view === "mcd")
        return {
          schema: {
            ...schema,
            entities: schema.entities.map((e) => ({
              ...e,
              attributes: e.attributes.filter(
                (a) =>
                  a.isPrimaryKey ||
                  !schema.relations.some(
                    (r) =>
                      r.cardinality !== "N-N" &&
                      r.targetEntityId === e.id &&
                      (r.targetColumnId === a.id ||
                        r.columnPairs?.some((p) => p.targetColumnId === a.id)),
                  ),
              ),
            })),
          },
          error: "",
        };
      return { schema, error: "" };
    } catch (error) {
      return { schema, error: message(error) };
    }
  }, [schema, view]);
  const graph = projection.schema;
  const openTable = useCallback((id: string, column?: string) => {
    setInspector({ kind: "table", id, column });
    selectTable(id);
    setExplorerOpen(false);
  }, []);
  const nodes = useMemo<TableFlowNode[]>(
    () =>
      graph.entities.map((entity) => ({
        id: entity.id,
        type: "table",
        position: entity.position,
        dragHandle: ".table-drag",
        selected: selectedTable === entity.id,
        draggable: !locked,
        deletable: !locked,
        data: {
          entity,
          readOnly: locked,
          conceptual: view === "mcd",
          onEdit: openTable,
          foreignColumns:
            view === "mcd"
              ? []
              : graph.relations
                  .filter(
                    (r) =>
                      r.cardinality !== "N-N" && r.targetEntityId === entity.id,
                  )
                  .flatMap(
                    (r) =>
                      r.columnPairs?.map((p) => p.targetColumnId) ?? [
                        r.targetColumnId,
                      ],
                  ),
        },
      })),
    [graph, locked, openTable, selectedTable, view],
  );
  const edges = useMemo<Edge[]>(
    () =>
      graph.relations.map((r) => ({
        id: r.id,
        source: r.sourceEntityId,
        target: r.targetEntityId,
        sourceHandle:
          view === "mcd" ? "entity:right" : r.sourceColumnId + ":right",
        targetHandle:
          view === "mcd" ? "entity:left" : r.targetColumnId + ":left",
        type: "smoothstep",
        label:
          (r.name ? r.name + " · " : "") + r.cardinality.replace("-", " : "),
        selected: selectedRelation === r.id,
        reconnectable: !locked,
        deletable: !locked,
        interactionWidth: 24,
        style: {
          strokeWidth: selectedRelation === r.id ? 2 : 1.4,
          stroke: "var(--accent)",
          strokeDasharray: r.cardinality === "N-N" ? "5 4" : undefined,
        },
        labelStyle: {
          fill: "var(--foreground)",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
        },
        labelBgStyle: { fill: "var(--surface)" },
        labelBgPadding: [8, 5],
        labelBgBorderRadius: 4,
      })),
    [graph.relations, locked, selectedRelation, view],
  );
  const connect = (c: Connection, replaceId?: string) => {
    if (!c.sourceHandle || !c.targetHandle || locked) return;
    const old = schema.relations.find((r) => r.id === replaceId);
    editor.connect(
      {
        sourceEntityId: c.source,
        sourceColumnId: handleColumn(c.sourceHandle),
        targetEntityId: c.target,
        targetColumnId: handleColumn(c.targetHandle),
        cardinality: old?.cardinality,
        name: old?.name,
        onDelete: old?.onDelete,
      },
      replaceId,
    );
  };
  const addTable = (position?: { x: number; y: number }) => {
    if (locked) return;
    const bounds = canvas.current?.getBoundingClientRect();
    const point =
      position ??
      screenToFlowPosition({
        x: (bounds?.left ?? 0) + (bounds?.width ?? 900) / 2 - 180,
        y: (bounds?.top ?? 0) + (bounds?.height ?? 600) / 2 - 80,
      });
    selectTable(editor.addTable(point));
    selectRelation(null);
    setMenu(null);
    setExplorerOpen(false);
  };
  const allowReplace = () =>
    !useEditor.getState().dirty ||
    window.confirm(
      "Remplacer le projet sans exporter les modifications en cours ?",
    );
  const openSchema = (value: Schema) => {
    editor.replace(value);
    setView("editor");
    selectTable(null);
    selectRelation(null);
    setInspector(null);
    setMenu(null);
    initialFit.current = false;
    window.history.replaceState(null, "", window.location.pathname);
    setTimeout(
      () => void fitView({ padding: 0.18, maxZoom: 1, duration: 250 }),
      100,
    );
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Fichier trop volumineux (5 Mo maximum).");
      const content = await file.text();
      const value = file.name.toLowerCase().endsWith(".sql")
        ? (await import("../model/import-sql")).importSQL(
            content,
            file.name.replace(/\.sql$/i, ""),
          )
        : parseProject(JSON.parse(content));
      if (allowReplace()) openSchema(value);
    } catch (error) {
      editor.notify(message(error));
    } finally {
      setLoading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const changeView = (value: View) => {
    setView(value);
    setInspector(null);
    selectRelation(null);
    setTimeout(
      () => void fitView({ padding: 0.18, maxZoom: 1, duration: 250 }),
      80,
    );
  };
  const exportImage = async (format: "png" | "svg") => {
    setLoading(true);
    try {
      const viewport = canvas.current?.querySelector<HTMLElement>(
        ".react-flow__viewport",
      );
      if (!viewport || !getNodes().length)
        throw new Error("Ajoutez une table avant l’export.");
      const bounds = getNodesBounds(getNodes());
      const width = Math.min(4096, Math.max(800, bounds.width + 120)),
        height = Math.min(4096, Math.max(500, bounds.height + 120));
      const transform = getViewportForBounds(
        bounds,
        width,
        height,
        0.01,
        2,
        0.12,
      );
      const { toPng, toSvg } = await import("html-to-image");
      const backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--canvas-background")
        .trim();
      const url = await (format === "png" ? toPng : toSvg)(viewport, {
        width,
        height,
        backgroundColor,
        pixelRatio: 1.5,
        style: {
          width: width + "px",
          height: height + "px",
          transform:
            "translate(" +
            transform.x +
            "px, " +
            transform.y +
            "px) scale(" +
            transform.zoom +
            ")",
        },
        filter: (node) =>
          !(
            node instanceof HTMLElement &&
            (node.classList.contains("export-hidden") ||
              node.classList.contains("react-flow__handle"))
          ),
      });
      downloadFile(
        await (await fetch(url)).blob(),
        filename(schema.name) + "-" + view + "." + format,
      );
      editor.notify("Diagramme exporté.");
    } catch (error) {
      editor.notify(message(error));
    } finally {
      setLoading(false);
    }
  };
  const share = () => {
    try {
      setShareLink(
        window.location.origin + "/tools/athena#athena=" + encodeShare(schema),
      );
      setDialog("share");
    } catch (error) {
      editor.notify(message(error));
    }
  };
  const closeProjectMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button"))
      e.currentTarget.closest("details")?.removeAttribute("open");
  };
  const existingRelation =
    inspector?.kind === "relation" && inspector.id
      ? schema.relations.find((r) => r.id === inspector.id)
      : undefined;
  return (
    <div className="schematic">
      <header className="schematic-toolbar">
        <div className="schematic-identity">
          <Braces size={22} />
          <h1>Athena</h1>
        </div>
        <div className="project-title">
          <input
            aria-label="Nom du projet"
            maxLength={100}
            value={schema.name}
            placeholder="Sans titre"
            readOnly={readOnly}
            onChange={(e) => editor.rename(e.target.value)}
          />
        </div>
        <div className="toolbar-history">
          <button
            className="icon-button"
            title="Annuler (Ctrl+Z)"
            aria-label="Annuler"
            disabled={readOnly || !editor.past.length}
            onClick={editor.undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="icon-button"
            title="Rétablir (Ctrl+Maj+Z)"
            aria-label="Rétablir"
            disabled={readOnly || !editor.future.length}
            onClick={editor.redo}
          >
            <Redo2 size={17} />
          </button>
        </div>
        <details className="toolbar-menu">
          <summary>
            <FolderOpen size={16} />
            <span>Projet</span>
          </summary>
          <div onClick={closeProjectMenu}>
            <button
              onClick={() => {
                if (allowReplace())
                  openSchema({
                    id: crypto.randomUUID(),
                    name: "Sans titre",
                    entities: [],
                    relations: [],
                  });
              }}
            >
              <FilePlus2 size={15} />
              Nouveau projet
            </button>
            <button
              disabled={loading}
              onClick={() => fileInput.current?.click()}
            >
              <ArrowUpFromLine size={15} />
              Importer JSON / SQL
            </button>
            <button onClick={download}>
              <ArrowDownToLine size={15} />
              Enregistrer .atlas.json<kbd>Ctrl S</kbd>
            </button>
            <button onClick={() => setDialog("history")}>
              <History size={15} />
              Versions de session
            </button>
            <button onClick={share}>
              <Share2 size={15} />
              Partager en lecture seule
            </button>
            <hr />
            <button disabled={loading} onClick={() => void exportImage("png")}>
              <ImageDown size={15} />
              Exporter en PNG
            </button>
            <button disabled={loading} onClick={() => void exportImage("svg")}>
              <ImageDown size={15} />
              Exporter en SVG
            </button>
          </div>
        </details>
        <Button className="generate-button" onClick={() => setDialog("export")}>
          <Code2 size={16} />
          <span>Générer</span>
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.atlas.json,.sql,application/json,text/plain"
          hidden
          onChange={(e) => void importFile(e.target.files?.[0])}
        />
      </header>
      <div className="canvas-toolbar">
        <button
          className="toolbar-text-button"
          aria-expanded={explorerOpen}
          onClick={() => {
            setExplorerOpen((o) => !o);
            setInspector(null);
          }}
        >
          <PanelLeftOpen size={16} />
          <span>Tables</span>
          <small>{schema.entities.length}</small>
        </button>
        <div className="toolbar-divider" />
        <button
          className="toolbar-text-button"
          disabled={locked}
          onClick={() => addTable()}
        >
          <Plus size={16} />
          <span>Table</span>
        </button>
        <button
          className="toolbar-text-button"
          disabled={locked || schema.entities.length < 1}
          onClick={() => {
            setInspector({ kind: "relation" });
            setExplorerOpen(false);
          }}
        >
          <Link2 size={16} />
          <span>Relation</span>
        </button>
        <button
          className="icon-button arrange-button"
          disabled={locked}
          title="Organiser les tables"
          aria-label="Organiser les tables"
          onClick={() => {
            editor.arrange();
            setTimeout(
              () => void fitView({ padding: 0.18, maxZoom: 1, duration: 250 }),
              80,
            );
          }}
        >
          <LayoutGrid size={16} />
        </button>
        <div className="view-switch" aria-label="Vue du schéma">
          {(["editor", "mcd", "mld"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => changeView(v)}
            >
              {v === "editor" ? "Éditeur" : v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {readOnly && (
        <div className="readonly-banner">
          <span>Schéma partagé en lecture seule</span>
          <button
            onClick={() => {
              editor.copyShared();
              window.history.replaceState(null, "", window.location.pathname);
            }}
          >
            Créer une copie modifiable
          </button>
        </div>
      )}
      <div className="schematic-body">
        <div className="schema-canvas" ref={canvas}>
          <ReactFlow<TableFlowNode>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
            minZoom={0.05}
            maxZoom={1.8}
            deleteKeyCode={locked ? null : ["Backspace", "Delete"]}
            snapToGrid
            snapGrid={[16, 16]}
            connectionMode={ConnectionMode.Loose}
            connectionRadius={36}
            reconnectRadius={24}
            connectOnClick
            nodesConnectable={!locked}
            edgesReconnectable={!locked}
            onNodesChange={(changes) => {
              for (const c of changes) {
                if (c.type === "position" && c.position && !locked)
                  editor.moveTable(c.id, c.position);
                if (c.type === "remove" && !locked) editor.removeTable(c.id);
                if (c.type === "select" && c.selected) selectTable(c.id);
              }
            }}
            onEdgesChange={(changes) => {
              for (const c of changes)
                if (c.type === "remove" && !locked) editor.removeRelation(c.id);
            }}
            onConnect={(c) => connect(c)}
            onReconnect={(edge, c) => connect(c, edge.id)}
            isValidConnection={(c) => {
              const a = schema.entities
                .find((e) => e.id === c.source)
                ?.attributes.find((a) => a.id === handleColumn(c.sourceHandle));
              const b = schema.entities
                .find((e) => e.id === c.target)
                ?.attributes.find((a) => a.id === handleColumn(c.targetHandle));
              return !!(
                a &&
                b &&
                (a.isPrimaryKey || b.isPrimaryKey) &&
                !(c.source === c.target && a.id === b.id)
              );
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
              if (!locked) {
                setInspector({ kind: "relation", id: edge.id });
                setExplorerOpen(false);
              }
            }}
            onPaneClick={() => {
              selectTable(null);
              selectRelation(null);
              setInspector(null);
              setMenu(null);
              setExplorerOpen(false);
            }}
            onPaneContextMenu={(event) => {
              event.preventDefault();
              if (locked) return;
              const b = canvas.current!.getBoundingClientRect();
              setMenu({
                x: Math.max(8, Math.min(event.clientX - b.left, b.width - 220)),
                y: Math.max(8, Math.min(event.clientY - b.top, b.height - 60)),
                flow: screenToFlowPosition({
                  x: event.clientX,
                  y: event.clientY,
                }),
              });
            }}
          >
            <Background gap={24} size={0.8} color="var(--canvas-dot)" />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor="var(--muted-surface)"
              nodeStrokeColor="var(--border)"
              maskColor="var(--canvas-mask)"
              pannable
              zoomable
            />
            {view !== "editor" && (
              <Panel position="top-center">
                <div className="view-notice">
                  {view === "mcd"
                    ? "Modèle conceptuel · entités et associations"
                    : "Modèle logique · clés étrangères et jointures"}
                  <button onClick={() => changeView("editor")}>Modifier</button>
                </div>
              </Panel>
            )}
            {!schema.entities.length && (
              <Panel position="top-center" className="empty-canvas">
                <Table2 size={32} strokeWidth={1} />
                <h2>Votre première table.</h2>
                <p>
                  Définissez ses colonnes, puis reliez les tables entre elles.
                </p>
                <Button disabled={locked} onClick={() => addTable()}>
                  <Plus size={16} />
                  Créer une table
                </Button>
              </Panel>
            )}
          </ReactFlow>
          {menu && (
            <div
              className="canvas-menu"
              role="menu"
              onPointerDown={(e) => e.stopPropagation()}
              style={{ left: menu.x, top: menu.y }}
            >
              <button
                role="menuitem"
                autoFocus
                onClick={() => addTable(menu.flow)}
              >
                <Plus size={16} />
                Créer une table
              </button>
            </div>
          )}
          {projection.error && (
            <div role="alert" className="canvas-error">
              {projection.error}
            </div>
          )}
          {view === "editor" && !readOnly && (
            <div className="canvas-help">
              Relier : glisser entre deux points ou cliquer sur chacun · Ctrl Z
              pour annuler
            </div>
          )}
        </div>
        {explorerOpen && (
          <aside
            className="editor-panel explorer-panel"
            aria-label="Tables du schéma"
          >
            <header>
              <h2>Tables</h2>
              <button onClick={() => setExplorerOpen(false)}>Fermer</button>
            </header>
            <input
              className="table-search"
              aria-label="Rechercher une table"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="table-list">
              {graph.entities
                .filter((e) =>
                  e.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      selectTable(e.id);
                      void setCenter(e.position.x + 180, e.position.y + 90, {
                        zoom: Math.max(getZoom(), 0.8),
                        duration: 250,
                      });
                      setExplorerOpen(false);
                    }}
                  >
                    <Table2 size={14} />
                    <span>{e.name || "Sans nom"}</span>
                    <small>{e.attributes.length}</small>
                  </button>
                ))}
            </div>
          </aside>
        )}
        {inspector && !locked && (
          <aside
            className="editor-panel inspector-panel"
            aria-label="Propriétés"
          >
            <header>
              <h2>{inspector.kind === "table" ? "Propriétés" : "Relation"}</h2>
              <button onClick={() => setInspector(null)}>Fermer</button>
            </header>
            {inspector.kind === "table" ? (
              <ColumnEditor
                tableId={inspector.id}
                columnId={inspector.column}
                onSelectColumn={(column) =>
                  setInspector({ ...inspector, column })
                }
                onClose={() => setInspector(null)}
              />
            ) : (
              <RelationEditor
                key={inspector.id ?? "new"}
                relation={existingRelation}
                onClose={() => setInspector(null)}
              />
            )}
          </aside>
        )}
      </div>
      <footer className="schematic-status">
        <span>
          {graph.entities.length} tables · {graph.relations.length} relations
        </span>
        <p role="status" aria-live="polite">
          {notice}
        </p>
        {dirty && <span>Modifications à enregistrer</span>}
      </footer>
      <Modal
        open={dialog === "export"}
        onClose={() => setDialog(null)}
        title="Générer votre backend"
        className="export-modal"
      >
        {dialog === "export" && <ExportPanel schema={schema} />}
      </Modal>
      <Modal
        open={dialog === "history"}
        onClose={() => setDialog(null)}
        title="Versions de session"
      >
        <div className="editor-form">
          <p className="form-hint">
            Ces versions restent disponibles pendant cette session. Enregistrez
            un fichier .atlas.json pour conserver une version après fermeture.
          </p>
          <label>
            Nom de version
            <input
              placeholder="Avant les nouvelles relations"
              maxLength={80}
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
            />
          </label>
          <Button
            disabled={readOnly}
            onClick={() => {
              editor.snapshot(snapshotName);
              setSnapshotName("");
            }}
          >
            Conserver cette version
          </Button>
          <div className="snapshot-list">
            {editor.snapshots.map((s) => (
              <div key={s.id}>
                <span>{s.name}</span>
                <button
                  disabled={readOnly}
                  onClick={() => editor.restore(s.id)}
                >
                  Restaurer
                </button>
                <button
                  title="Exporter cette version"
                  aria-label={"Exporter " + s.name}
                  onClick={() =>
                    downloadFile(
                      new Blob([serializeProject(s.schema)], {
                        type: "application/json",
                      }),
                      filename(s.name) + ".atlas.json",
                    )
                  }
                >
                  <ArrowDownToLine size={14} />
                </button>
              </div>
            ))}
          </div>
          {!editor.snapshots.length && (
            <p className="form-hint">Aucune version conservée.</p>
          )}
        </div>
      </Modal>
      <Modal
        open={dialog === "share"}
        onClose={() => setDialog(null)}
        title="Partager le schéma"
      >
        <div className="editor-form">
          <p className="form-hint">
            Le lien contient une copie du schéma. Toute personne qui le reçoit
            peut le consulter et en créer une copie, sans compte.
          </p>
          <label>
            Lien en lecture seule
            <input
              readOnly
              value={shareLink}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareLink);
                editor.notify("Lien copié.");
                setDialog(null);
              } catch {
                editor.notify(
                  "Sélectionnez le lien et copiez-le manuellement.",
                );
              }
            }}
          >
            <Copy size={14} />
            Copier le lien
          </Button>
        </div>
      </Modal>
    </div>
  );
}
