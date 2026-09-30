"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
} from "@xyflow/react";
import {
  Network,
  Plus,
  Layers,
  LayoutGrid,
  Undo2,
  Redo2,
  FolderOpen,
  Download,
  X,
  Trash2,
  Copy,
  Search,
  Maximize,
  Link2,
} from "lucide-react";
import { catalog } from "./catalog";
import {
  arrange,
  descendants,
  environments,
  exampleProject,
  groupAtDrop,
  makeNode,
  orderedNodes,
  parseProject,
  removeNode,
  reparent,
  serializeProject,
  type MapLink,
  type MapNode,
  type Point,
} from "./model";
import { nodeTypes, ServiceIcon, type IrisFlowNode } from "./nodes";
import { useIris } from "./store";
import { download, exportImage } from "./export";
import "@xyflow/react/dist/style.css";
import "./iris.css";

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="iris-field">
      {label}
      {multiline ? (
        <textarea
          key={value}
          defaultValue={value}
          maxLength={2000}
          onBlur={(e) => {
            if (e.target.value !== value) onChange(e.target.value);
          }}
        />
      ) : (
        <input
          key={value}
          defaultValue={value}
          maxLength={200}
          onBlur={(e) => {
            if (e.target.value !== value) onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      )}
    </label>
  );
}

function Workspace() {
  const {
    project,
    past,
    future,
    dirty,
    edit,
    checkpoint,
    undo,
    redo,
    replace,
    saved,
  } = useIris();
  const flow = useReactFlow<IrisFlowNode>();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [notice, setNotice] = useState(
    "Reliez les points des services. Glissez un service dans une zone pour l’y regrouper.",
  );
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState<{
    x: number;
    y: number;
    point: Point;
  }>();
  const [insertAt, setInsertAt] = useState<Point>();
  const [linkForm, setLinkForm] = useState(false);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const node = project.nodes.find((n) => n.id === selected);
  const link = project.links.find((l) => l.id === selected);
  const fit = useCallback(() => {
    setTimeout(() => void flow.fitView({ padding: 0.16, duration: 250 }), 50);
  }, [flow]);
  const save = useCallback(() => {
    try {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
      const current = useIris.getState().project;
      download(
        new Blob([serializeProject(current)], { type: "application/json" }),
        `${current.name}.atlas.json`,
      );
      saved();
      setNotice(
        "Projet téléchargé. Conservez ce fichier pour reprendre votre travail.",
      );
    } catch {
      setNotice(
        "Le projet contient des valeurs invalides. Vérifiez les propriétés.",
      );
    }
  }, [saved]);
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    edit((p) => {
      if (p.nodes.some((n) => n.id === selected)) removeNode(p, selected);
      else p.links = p.links.filter((l) => l.id !== selected);
    });
    setSelected(undefined);
  }, [selected, edit]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (useIris.getState().dirty) e.preventDefault();
    };
    const keys = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        !!e.target.closest("input,textarea,select,[contenteditable=true]");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete") deleteSelected();
      if (e.key === "Escape") {
        setSelected(undefined);
        setCatalogOpen(false);
        setContext(undefined);
        setLinkForm(false);
      }
    };
    window.addEventListener("beforeunload", before);
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("keydown", keys);
    };
  }, [save, undo, redo, deleteSelected]);
  const center = () => {
    const rect = canvas.current?.getBoundingClientRect();
    return flow.screenToFlowPosition({
      x: rect ? rect.left + rect.width / 2 - 112 : 400,
      y: rect ? rect.top + rect.height / 2 - 52 : 300,
    });
  };
  const add = (
    service: string,
    kind: MapNode["kind"] = "service",
    point?: Point,
  ) => {
    if (project.nodes.length >= 500) {
      setNotice("Limite de 500 éléments atteinte.");
      return;
    }
    const created = makeNode(service, point ?? insertAt ?? center(), kind);
    edit((p) => {
      p.nodes.push(created);
      if (kind === "service") groupAtDrop(p, created.id);
    });
    setSelected(created.id);
    setInsertAt(undefined);
    setContext(undefined);
    setCatalogOpen(false);
    setLinkForm(false);
  };
  const connect = (connection: Connection) => {
    if (
      !connection.source ||
      !connection.target ||
      connection.source === connection.target
    )
      return;
    if (project.links.length >= 2000) {
      setNotice("Limite de 2 000 flux atteinte.");
      return;
    }
    const id = crypto.randomUUID();
    edit((p) =>
      p.links.push({
        id,
        source: connection.source,
        target: connection.target,
        sourceSide: (connection.sourceHandle ??
          "right") as MapLink["sourceSide"],
        targetSide: (connection.targetHandle ??
          "left") as MapLink["targetSide"],
        name: "Nouveau flux",
        protocol: "",
        mode: "sync",
        direction: "forward",
        description: "",
      }),
    );
    setSelected(id);
    setLinkForm(false);
    setCatalogOpen(false);
    setNotice("Flux créé. Nommez-le dans ses propriétés.");
  };
  const nodes = useMemo<IrisFlowNode[]>(
    () =>
      orderedNodes(project.nodes).map((item) => ({
        id: item.id,
        type: item.kind,
        position: item.position,
        parentId: item.parentId,
        data: { item },
        style: { width: item.width, height: item.height },
        selected: item.id === selected,
        dragHandle: item.kind === "zone" ? ".iris-zone-title" : undefined,
      })),
    [project.nodes, selected],
  );
  const edges = useMemo<Edge[]>(
    () =>
      project.links.map((item) => ({
        id: item.id,
        source: item.source,
        target: item.target,
        sourceHandle: item.sourceSide,
        targetHandle: item.targetSide,
        type: "smoothstep",
        label: [item.name, item.protocol].filter(Boolean).join(" · "),
        selected: item.id === selected,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "var(--muted)",
        },
        markerStart:
          item.direction === "both"
            ? {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
                color: "var(--muted)",
              }
            : undefined,
        style: {
          stroke: "var(--muted)",
          strokeWidth: item.id === selected ? 2 : 1.3,
          strokeDasharray: item.mode === "async" ? "6 5" : undefined,
        },
        labelStyle: { fill: "var(--foreground)", fontSize: 11 },
        labelBgStyle: { fill: "var(--surface)" },
        labelBgPadding: [7, 5],
      })),
    [project.links, selected],
  );
  const patchNode = (patch: Partial<MapNode>) =>
    edit((p) =>
      Object.assign(
        p.nodes.find((n) => n.id === selected)!,
        patch,
      ),
    );
  const patchLink = (patch: Partial<MapLink>) =>
    edit((p) =>
      Object.assign(
        p.links.find((l) => l.id === selected)!,
        patch,
      ),
    );
  const changeProject = (example: boolean) => {
    if (
      dirty &&
      !window.confirm(
        "Remplacer le projet en cours ? Téléchargez-le d’abord pour le conserver.",
      )
    )
      return;
    replace(
      example
        ? exampleProject()
        : { name: "Nouvelle cartographie", nodes: [], links: [] },
    );
    setSelected(undefined);
    fit();
  };
  const image = async (format: "svg" | "png") => {
    setBusy(true);
    try {
      await exportImage(project, format);
      setNotice(`Export ${format.toUpperCase()} téléchargé.`);
    } catch {
      setNotice(
        "L’export n’a pas abouti. Réessayez en SVG ou réduisez la taille de la carte.",
      );
    } finally {
      setBusy(false);
    }
  };
  const services = project.nodes.filter((n) => n.kind === "service");
  return (
    <div className="iris-workspace">
      <header className="iris-topbar">
        <div className="iris-brand">
          <Network size={20} />
          <strong>Iris</strong>
        </div>
        <input
          className="iris-project-name"
          aria-label="Nom du projet"
          key={project.name}
          defaultValue={project.name}
          maxLength={200}
          onBlur={(e) => {
            const name = e.target.value.trim();
            if (name && name !== project.name)
              edit((p) => {
                p.name = name;
              });
            else e.target.value = project.name;
          }}
        />
        <div className="iris-actions">
          <button
            title="Annuler (Ctrl Z)"
            aria-label="Annuler"
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={16} />
          </button>
          <button
            title="Rétablir"
            aria-label="Rétablir"
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={16} />
          </button>
          <details className="iris-menu">
            <summary>
              <FolderOpen size={16} />
              <span>Projet</span>
            </summary>
            <div>
              <button onClick={save}>Enregistrer .atlas.json</button>
              <button onClick={() => input.current?.click()}>
                Importer un projet
              </button>
              <button onClick={() => changeProject(false)}>
                Nouvelle cartographie
              </button>
              <button onClick={() => changeProject(true)}>
                Charger l’exemple
              </button>
            </div>
          </details>
          <details className="iris-menu">
            <summary>
              <Download size={16} />
              <span>Export</span>
            </summary>
            <div>
              <button
                disabled={busy || !project.nodes.length}
                onClick={() => void image("svg")}
              >
                Image SVG
              </button>
              <button
                disabled={busy || !project.nodes.length}
                onClick={() => void image("png")}
              >
                Image PNG
              </button>
            </div>
          </details>
        </div>
        <input
          ref={input}
          type="file"
          accept=".json,.atlas.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              if (file.size > 5_000_000)
                throw new Error("Fichier trop volumineux (5 Mo maximum).");
              const imported = parseProject(JSON.parse(await file.text()));
              if (
                dirty &&
                !window.confirm("Remplacer le projet en cours par ce fichier ?")
              )
                return;
              replace(imported);
              setSelected(undefined);
              fit();
              setNotice("Projet importé.");
            } catch (error) {
              setNotice(
                error instanceof Error && !("issues" in error)
                  ? error.message
                  : "Fichier Iris invalide ou version non prise en charge.",
              );
            }
          }}
        />
      </header>
      <div className="iris-toolbar">
        <button
          aria-expanded={catalogOpen}
          onClick={() => {
            setCatalogOpen(!catalogOpen);
            setSelected(undefined);
            setLinkForm(false);
            setInsertAt(undefined);
          }}
        >
          <Plus size={16} />
          Service
        </button>
        <button onClick={() => add("cloud", "zone")}>
          <Layers size={16} />
          Zone
        </button>
        <button
          onClick={() => {
            setLinkForm(true);
            setCatalogOpen(false);
            setSelected(undefined);
          }}
          disabled={services.length < 2}
        >
          <Link2 size={16} />
          Flux
        </button>
        <span className="iris-separator" />
        <button
          title="Organiser la cartographie"
          aria-label="Organiser la cartographie"
          onClick={() => {
            edit(arrange);
            fit();
          }}
        >
          <LayoutGrid size={16} />
        </button>
        <button title="Tout afficher" aria-label="Tout afficher" onClick={fit}>
          <Maximize size={16} />
        </button>
        <span className="iris-toolbar-caption">CARTOGRAPHIE DU SI</span>
      </div>
      <div className="iris-canvas" ref={canvas}>
        <ReactFlow<IrisFlowNode>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          minZoom={0.15}
          maxZoom={2}
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={null}
          onConnect={connect}
          isValidConnection={(c) =>
            c.source !== c.target &&
            project.nodes.some(
              (n) => n.id === c.source && n.kind === "service",
            ) &&
            project.nodes.some((n) => n.id === c.target && n.kind === "service")
          }
          onReconnect={(edge, c) =>
            edit((p) => {
              const l = p.links.find((l) => l.id === edge.id)!;
              Object.assign(l, {
                source: c.source,
                target: c.target,
                sourceSide: c.sourceHandle,
                targetSide: c.targetHandle,
              });
            })
          }
          onNodeClick={(_, n) => {
            setSelected(n.id);
            setCatalogOpen(false);
            setLinkForm(false);
          }}
          onEdgeClick={(_, e) => {
            setSelected(e.id);
            setCatalogOpen(false);
            setLinkForm(false);
          }}
          onPaneClick={() => {
            setSelected(undefined);
            setContext(undefined);
          }}
          onNodeDragStart={checkpoint}
          onNodeDrag={(_, n) =>
            edit((p) => {
              const item = p.nodes.find((i) => i.id === n.id)!;
              item.position = n.position;
            }, false)
          }
          onNodeDragStop={(_, n) =>
            edit((p) => {
              const item = p.nodes.find((i) => i.id === n.id)!;
              item.position = n.position;
              groupAtDrop(p, n.id);
            }, false)
          }
          onPaneContextMenu={(e) => {
            e.preventDefault();
            const rect = canvas.current!.getBoundingClientRect();
            setContext({
              x: Math.max(0, Math.min(e.clientX - rect.left, rect.width - 190)),
              y: Math.max(0, Math.min(e.clientY - rect.top, rect.height - 90)),
              point: flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }),
            });
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("application/atlas-service");
            if (catalog.some((s) => s.id === id))
              add(
                id,
                "service",
                flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }),
              );
          }}
        >
          <Background color="var(--canvas-dot)" gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
        {!project.nodes.length && (
          <div className="iris-empty">
            <Network size={36} strokeWidth={1} />
            <h1>Votre SI, en perspective.</h1>
            <p>
              Posez vos services, délimitez vos zones
              <br />
              et donnez un sens aux connexions.
            </p>
            <button onClick={() => setCatalogOpen(true)}>
              <Plus size={16} />
              Ajouter un service
            </button>
            <button onClick={() => changeProject(true)}>
              Explorer un exemple
            </button>
          </div>
        )}
        {context && (
          <div
            className="iris-context"
            style={{ left: context.x, top: context.y }}
          >
            <button
              onClick={() => {
                setInsertAt(context.point);
                setCatalogOpen(true);
                setContext(undefined);
              }}
            >
              Ajouter un service
            </button>
            <button onClick={() => add("cloud", "zone", context.point)}>
              Créer une zone
            </button>
          </div>
        )}
        {catalogOpen && (
          <aside
            className="iris-panel iris-catalog"
            aria-label="Catalogue de services"
          >
            <div className="iris-panel-title">
              <div>
                <small>COMPOSER</small>
                <h2>Services</h2>
              </div>
              <button
                aria-label="Fermer le catalogue"
                onClick={() => setCatalogOpen(false)}
              >
                <X size={17} />
              </button>
            </div>
            <label className="iris-search">
              <Search size={16} />
              <input
                autoFocus
                placeholder="Rechercher un service…"
                aria-label="Rechercher un service"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Catégorie"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {[...new Set(catalog.map((s) => s.category))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="iris-catalog-list">
              {catalog
                .filter(
                  (s) =>
                    (!category || s.category === category) &&
                    `${s.name} ${s.description}`
                      .toLocaleLowerCase()
                      .includes(query.toLocaleLowerCase()),
                )
                .map((s) => (
                  <button
                    key={s.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("application/atlas-service", s.id)
                    }
                    onClick={() => add(s.id)}
                  >
                    <ServiceIcon service={s.id} />
                    <span>
                      <strong>{s.name}</strong>
                      <small>{s.description}</small>
                    </span>
                    <Plus size={14} />
                  </button>
                ))}
            </div>
            <p className="iris-panel-note">
              Cliquez ou glissez sur le canvas. Les logos des éditeurs sont
              conservés dans le projet Atlas, sans appel externe.
            </p>
          </aside>
        )}
        {(node || link || linkForm) && (
          <aside className="iris-panel iris-inspector" aria-label="Propriétés">
            <div className="iris-panel-title">
              <div>
                <small>
                  {node?.kind === "zone"
                    ? "PÉRIMÈTRE"
                    : node
                      ? "COMPOSANT"
                      : "CONNEXION"}
                </small>
                <h2>
                  {node?.kind === "zone" ? "Zone" : node ? "Service" : "Flux"}
                </h2>
              </div>
              <button
                aria-label="Fermer les propriétés"
                onClick={() => {
                  setSelected(undefined);
                  setLinkForm(false);
                }}
              >
                <X size={17} />
              </button>
            </div>
            {node && (
              <div key={node.id} className="iris-fields">
                <TextField
                  label="Nom"
                  value={node.name}
                  onChange={(name) => {
                    if (name.trim()) patchNode({ name: name.trim() });
                  }}
                />
                {node.kind === "service" && (
                  <label className="iris-field">
                    Service / logo
                    <select
                      value={node.service}
                      onChange={(e) => patchNode({ service: e.target.value })}
                    >
                      {catalog.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <TextField
                  label="Description"
                  value={node.description}
                  onChange={(description) => patchNode({ description })}
                  multiline
                />
                <label className="iris-field">
                  Zone parente
                  <select
                    value={node.parentId ?? ""}
                    onChange={(e) => {
                      try {
                        edit((p) =>
                          reparent(p, node.id, e.target.value || undefined),
                        );
                      } catch {
                        setNotice("Imbrication impossible.");
                      }
                    }}
                  >
                    <option value="">Aucune — racine</option>
                    {project.nodes
                      .filter(
                        (n) =>
                          n.kind === "zone" &&
                          !descendants(node.id, project.nodes).has(n.id),
                      )
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="iris-field">
                  Environnement
                  <select
                    value={node.environment}
                    onChange={(e) =>
                      patchNode({
                        environment: e.target.value as MapNode["environment"],
                      })
                    }
                  >
                    {environments.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="Responsable / équipe"
                  value={node.owner}
                  onChange={(owner) => patchNode({ owner })}
                />
                {node.kind === "service" && (
                  <>
                    <TextField
                      label="Technologie / version"
                      value={node.technology}
                      onChange={(technology) => patchNode({ technology })}
                    />
                    <label className="iris-field">
                      Criticité
                      <select
                        value={node.criticality}
                        onChange={(e) =>
                          patchNode({
                            criticality: e.target
                              .value as MapNode["criticality"],
                          })
                        }
                      >
                        {["Standard", "Important", "Critique"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      onClick={() => {
                        if (project.nodes.length >= 500) {
                          setNotice("Limite de 500 éléments atteinte.");
                          return;
                        }
                        const copy = {
                          ...structuredClone(node),
                          id: crypto.randomUUID(),
                          position: {
                            x: node.position.x + 32,
                            y: node.position.y + 128,
                          },
                          name: `${node.name.slice(0, 190)} copie`,
                        };
                        edit((p) => {
                          p.nodes.push(copy);
                          groupAtDrop(p, copy.id);
                        });
                        setSelected(copy.id);
                      }}
                    >
                      <Copy size={15} />
                      Dupliquer
                    </button>
                  </>
                )}
                {node.kind === "zone" && (
                  <p className="iris-panel-note">
                    Déplacez la zone par son titre. Redimensionnez-la par ses
                    coins. Les services qu’elle contient suivent ses
                    déplacements.
                  </p>
                )}
              </div>
            )}
            {link && (
              <div key={link.id} className="iris-fields">
                <TextField
                  label="Nom du flux"
                  value={link.name}
                  onChange={(name) => patchLink({ name })}
                />
                <TextField
                  label="Protocole / port"
                  value={link.protocol}
                  onChange={(protocol) =>
                    patchLink({ protocol: protocol.slice(0, 80) })
                  }
                />
                <label className="iris-field">
                  Transmission
                  <select
                    value={link.mode}
                    onChange={(e) =>
                      patchLink({ mode: e.target.value as MapLink["mode"] })
                    }
                  >
                    <option value="sync">Synchrone</option>
                    <option value="async">Asynchrone</option>
                  </select>
                </label>
                <label className="iris-field">
                  Direction
                  <select
                    value={link.direction}
                    onChange={(e) =>
                      patchLink({
                        direction: e.target.value as MapLink["direction"],
                      })
                    }
                  >
                    <option value="forward">Source → destination</option>
                    <option value="both">Bidirectionnel</option>
                  </select>
                </label>
                <TextField
                  label="Description"
                  value={link.description}
                  onChange={(description) => patchLink({ description })}
                  multiline
                />
                <p className="iris-panel-note">
                  {project.nodes.find((n) => n.id === link.source)?.name} →{" "}
                  {project.nodes.find((n) => n.id === link.target)?.name}.
                  Déplacez une extrémité du flux pour la reconnecter.
                </p>
              </div>
            )}
            {linkForm && (
              <div className="iris-fields">
                <label className="iris-field">
                  Source
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="">Choisir un service</option>
                    {services.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="iris-field">
                  Destination
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="">Choisir un service</option>
                    {services
                      .filter((n) => n.id !== source)
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  disabled={!source || !target || source === target}
                  onClick={() =>
                    connect({
                      source,
                      target,
                      sourceHandle: "right",
                      targetHandle: "left",
                    })
                  }
                >
                  <Link2 size={15} />
                  Créer le flux
                </button>
                <p className="iris-panel-note">
                  Vous pouvez aussi relier les points sur les côtés des
                  services, par glisser-déposer ou par deux clics.
                </p>
              </div>
            )}
            {(node || link) && (
              <button className="iris-delete" onClick={deleteSelected}>
                <Trash2 size={15} />
                {node?.kind === "zone" ? "Dissoudre la zone" : "Supprimer"}
              </button>
            )}
          </aside>
        )}
      </div>
      <footer className="iris-status">
        <span>
          {services.length} services · {project.nodes.length - services.length}{" "}
          zones · {project.links.length} flux
        </span>
        <span role="status">{busy ? "Préparation de l’image…" : notice}</span>
        <span>
          {dirty
            ? "Modifications à enregistrer"
            : "Fichier local · sans compte"}
        </span>
      </footer>
    </div>
  );
}
export function Iris() {
  return (
    <ReactFlowProvider>
      <Workspace />
    </ReactFlowProvider>
  );
}
