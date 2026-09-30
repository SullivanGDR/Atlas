"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClipboardList,
  FolderOpen,
  Download,
  Undo2,
  Redo2,
  PanelLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Bold,
  List,
  Heading2,
  Check,
  FileText,
  ArrowRight,
  Search,
  Copy,
  X,
} from "lucide-react";
import { Dropdown, Modal, useConfirmation } from "@atlas/ui";
import {
  addRequirement,
  defaultExportOptions,
  hasPlaceholder,
  parseProject,
  priorities,
  requirementTypes,
  reviewProject,
  serializeProject,
  type ExportOptions,
  type Requirement,
  type SpecProject,
} from "./model";
import {
  createProject,
  guides,
  outlineFor,
  sectionPrompts,
  templates,
  type TemplateId,
} from "./templates";
import { useThemis } from "./store";
import { downloadFile } from "./docx";
import { DocumentPreview } from "./preview";
import "./themis.css";

function Field({
  label,
  value,
  onChange,
  area = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="themis-field">
      <span>{label}</span>
      {area ? (
        <textarea
          value={value}
          maxLength={40000}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          value={value}
          maxLength={300}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function Themis() {
  const { project, dirty, past, future, edit, undo, redo, replace, saved } =
    useThemis();
  const { confirm, confirmationDialog } = useConfirmation();
  const [view, setView] = useState<
    "write" | "requirements" | "review" | "preview"
  >("write");
  const [active, setActive] = useState("context");
  const [outline, setOutline] = useState(false);
  const [dialog, setDialog] = useState<
    "new" | "word" | "google" | "metadata" | null
  >(null);
  const [selectedReq, setSelectedReq] = useState<string>();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("");
  const [notice, setNotice] = useState(
    "Votre document reste dans ce navigateur. Enregistrez le fichier projet pour le retrouver.",
  );
  const [options, setOptions] = useState<ExportOptions>(defaultExportOptions);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const section =
    project.sections.find((s) => s.id === active) ?? project.sections[0]!;
  const guide = guides.find((g) => g.id === section.id);
  const requirement = project.requirements.find((r) => r.id === selectedReq);
  const issues = reviewProject(project);
  const included = project.sections.filter((s) => s.included);
  const completed = included.filter(
    (s) => s.content.trim() && !hasPlaceholder(s.content),
  ).length;
  const save = useCallback(() => {
    try {
      const p = useThemis.getState().project;
      downloadFile(
        serializeProject(p),
        "application/json",
        `${p.name}.atlas.json`,
      );
      saved();
      setNotice(
        "Projet téléchargé. Le fichier .atlas.json permet de reprendre la rédaction.",
      );
    } catch {
      setNotice(
        "Enregistrement impossible : vérifiez le nom et les informations du document.",
      );
    }
  }, [saved]);
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (useThemis.getState().dirty) e.preventDefault();
    };
    const key = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open],[role="dialog"]')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }
      const typing =
        e.target instanceof HTMLElement &&
        !!e.target.closest("input,textarea,select,[contenteditable=true]");
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === "Escape") setOutline(false);
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("keydown", key);
    };
  }, [save, undo, redo]);
  const navigate = (id: string) => {
    if (id === "metadata") setDialog("metadata");
    else if (id === "requirements" || id.startsWith("REQ-")) {
      setView("requirements");
      if (id.startsWith("REQ-")) setSelectedReq(id);
    } else {
      setActive(id);
      setView("write");
    }
    setOutline(false);
  };
  const meta = (patch: Partial<SpecProject>, key: string) =>
    edit((p) => Object.assign(p, patch), `meta-${key}`);
  const updateContent = (content: string) =>
    edit((p) => {
      const s = p.sections.find((s) => s.id === section.id)!;
      s.content = content;
      s.reviewed = false;
      p.status = "Brouillon";
    }, `section-${section.id}`);
  const patchReq = (patch: Partial<Requirement>, key: string) =>
    edit((p) => {
      const r = p.requirements.find((r) => r.id === selectedReq)!;
      Object.assign(r, patch);
      if (key !== "status") r.status = "Brouillon";
      p.status = "Brouillon";
    }, `${selectedReq}-${key}`);
  const newRequirement = () => {
    try {
      let id = "";
      edit((p) => {
        id = addRequirement(p);
        p.status = "Brouillon";
      });
      setSelectedReq(id);
      setView("requirements");
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const start = async (template: TemplateId) => {
    if (
      useThemis.getState().dirty &&
      !(await confirm(
        "Le nouveau modèle remplacera votre cahier des charges et ses modifications non enregistrées. Enregistrez votre fichier projet pour les conserver.",
      ))
    )
      return;
    replace(createProject(template));
    setDialog(null);
    setView("write");
    setActive("context");
    setSelectedReq(undefined);
    setNotice(
      "Modèle prêt. Commencez par le contexte et les objectifs du projet.",
    );
  };
  const move = (offset: number) =>
    edit((p) => {
      const i = p.sections.findIndex((s) => s.id === section.id);
      const target = i + offset;
      if (target < 0 || target >= p.sections.length) return;
      [p.sections[i], p.sections[target]] = [
        p.sections[target]!,
        p.sections[i]!,
      ];
    });
  const format = (kind: "bold" | "list" | "heading") => {
    const field = textarea.current;
    if (!field) return;
    const start = field.selectionStart,
      end = field.selectionEnd;
    const selected = section.content.slice(start, end);
    const insertion =
      kind === "bold"
        ? `**${selected || "texte"}**`
        : `${start && section.content[start - 1] !== "\n" ? "\n" : ""}${kind === "list" ? "- " : "## "}${selected || "À préciser"}`;
    updateContent(
      section.content.slice(0, start) + insertion + section.content.slice(end),
    );
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(
        start + insertion.length,
        start + insertion.length,
      );
    });
  };
  const exportWord = async () => {
    setBusy(true);
    try {
      const { createDocx } = await import("./docx");
      const p = parseProject({ format: "atlas-themis", version: 1, project });
      const bytes = createDocx(p, options);
      downloadFile(
        new Uint8Array(bytes).buffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        `${p.name}.docx`,
      );
      setNotice(
        "Document Word téléchargé. Le fichier projet .atlas.json reste nécessaire pour reprendre dans Thémis.",
      );
    } catch {
      setNotice(
        "Export impossible. Vérifiez les informations du projet puis réessayez.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="themis-workspace">
      {confirmationDialog}
      <header className="themis-topbar">
        <div className="themis-brand">
          <ClipboardList size={20} />
          <strong>Thémis</strong>
        </div>
        <button
          className="themis-project-title"
          onClick={() => setDialog("metadata")}
          title="Informations du document"
        >
          {project.name}
          <span>
            {project.version} · {project.status}
          </span>
        </button>
        <div className="themis-actions">
          <button
            aria-label="Annuler"
            title="Annuler"
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={16} />
          </button>
          <button
            aria-label="Rétablir"
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={16} />
          </button>
          <Dropdown
            className="themis-menu"
            trigger={
              <>
                <FolderOpen size={16} />
                <span>Projet</span>
              </>
            }
          >
            <button onClick={() => setDialog("new")}>
              Nouveau depuis un modèle
            </button>
            <button onClick={() => setDialog("metadata")}>
              Informations du document
            </button>
            <button onClick={save}>Enregistrer .atlas.json</button>
            <button onClick={() => fileInput.current?.click()}>
              Importer un projet Thémis
            </button>
          </Dropdown>
          <Dropdown
            className="themis-menu"
            trigger={
              <>
                <Download size={16} />
                <span>Export</span>
              </>
            }
          >
            <button onClick={() => setDialog("word")}>
              Document Word (.docx)
            </button>
            <button onClick={() => setDialog("google")}>
              Pour Google Docs
            </button>
          </Dropdown>
        </div>
      </header>
      <div className="themis-toolbar">
        <button
          aria-label="Afficher le plan"
          aria-expanded={outline}
          onClick={() => setOutline(!outline)}
        >
          <PanelLeft size={16} />
          <span>Plan</span>
        </button>
        <nav aria-label="Vue de rédaction">
          {[
            ["write", "Rédaction"],
            ["requirements", "Exigences"],
            ["review", "Relecture"],
            ["preview", "Aperçu"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              onClick={() => {
                setView(id as typeof view);
                setOutline(false);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <span className="themis-progress">
          {completed}/{included.length} rubriques renseignées
        </span>
      </div>
      <div className="themis-body">
        <aside
          className={`themis-outline ${outline ? "is-open" : ""}`}
          aria-label="Plan du cahier des charges"
        >
          <div className="themis-outline-heading">
            <span>VOTRE DOCUMENT</span>
            <button
              aria-label="Fermer le plan"
              onClick={() => setOutline(false)}
            >
              <X size={15} />
            </button>
          </div>
          <button
            className="themis-meta-link"
            onClick={() => setDialog("metadata")}
          >
            <FileText size={15} />
            Page de garde
          </button>
          <ol>
            {project.sections.map((s, i) => (
              <li key={s.id}>
                <button
                  aria-current={
                    view === "write" && section.id === s.id ? "step" : undefined
                  }
                  onClick={() => navigate(s.id)}
                  className={!s.included ? "is-excluded" : ""}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.title}</span>
                  {s.reviewed && <Check size={12} />}
                </button>
              </li>
            ))}
          </ol>
          <button
            onClick={() => {
              if (project.sections.length >= 50) {
                setNotice("Limite de 50 rubriques atteinte.");
                return;
              }
              const id = crypto.randomUUID();
              edit((p) =>
                p.sections.push({
                  id,
                  title: "Nouvelle rubrique",
                  content: "",
                  included: true,
                  reviewed: false,
                }),
              );
              navigate(id);
            }}
          >
            <Plus size={14} />
            Rubrique libre
          </button>
          <div className="themis-outline-bottom">
            <span>{project.requirements.length} exigences</span>
            <button onClick={() => setDialog("new")}>Changer de modèle</button>
          </div>
        </aside>
        {outline && (
          <button
            className="themis-outline-backdrop"
            aria-label="Fermer le plan"
            onClick={() => setOutline(false)}
          />
        )}
        <section className="themis-content" aria-label="Espace de rédaction">
          {view === "write" && (
            <div className="themis-writing" key={section.id}>
              <div className="themis-section-top">
                <span>
                  RUBRIQUE{" "}
                  {String(project.sections.indexOf(section) + 1).padStart(
                    2,
                    "0",
                  )}
                </span>
                <div>
                  <button
                    title="Monter la rubrique"
                    aria-label="Monter la rubrique"
                    disabled={project.sections.indexOf(section) === 0}
                    onClick={() => move(-1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    title="Descendre la rubrique"
                    aria-label="Descendre la rubrique"
                    disabled={
                      project.sections.indexOf(section) ===
                      project.sections.length - 1
                    }
                    onClick={() => move(1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
              <input
                className="themis-section-title"
                aria-label="Titre de la rubrique"
                maxLength={300}
                value={section.title}
                onChange={(e) => {
                  const title = e.target.value;
                  edit((p) => {
                    p.sections.find((s) => s.id === section.id)!.title = title;
                  }, `title-${section.id}`);
                }}
                onBlur={() => {
                  if (!section.title.trim())
                    edit((p) => {
                      p.sections.find((s) => s.id === section.id)!.title =
                        "Sans titre";
                    });
                }}
              />
              <p className="themis-question">
                {guide?.question ??
                  "Ajoutez ici les précisions propres à votre projet."}
              </p>
              <details className="themis-guide">
                <summary>Repères pour rédiger cette rubrique</summary>
                <ul>
                  {sectionPrompts(project.template, section.id).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {guide && (
                  <>
                    <small>EXEMPLE À ADAPTER — NON AJOUTÉ AU DOCUMENT</small>
                    <p>{guide.example}</p>
                  </>
                )}
                <button
                  disabled={!guide}
                  onClick={() =>
                    updateContent(
                      `${section.content}${section.content ? "\n\n" : ""}${outlineFor(project.template, section.id)}`,
                    )
                  }
                >
                  <Plus size={14} />
                  Insérer une trame à compléter
                </button>
              </details>
              <div className="themis-editor">
                <div className="themis-editor-toolbar">
                  <button
                    aria-label="Mettre en gras"
                    title="Gras"
                    onClick={() => format("bold")}
                  >
                    <Bold size={15} />
                  </button>
                  <button
                    aria-label="Ajouter une liste"
                    title="Liste"
                    onClick={() => format("list")}
                  >
                    <List size={16} />
                  </button>
                  <button
                    aria-label="Ajouter un sous-titre"
                    title="Sous-titre"
                    onClick={() => format("heading")}
                  >
                    <Heading2 size={16} />
                  </button>
                  <span>Texte, listes et sous-titres</span>
                </div>
                <textarea
                  ref={textarea}
                  aria-label="Contenu de la rubrique"
                  value={section.content}
                  maxLength={40000}
                  placeholder="Commencez ici. Décrivez les faits, les attentes et les décisions à prendre…"
                  onChange={(e) => updateContent(e.target.value)}
                />
              </div>
              <div className="themis-section-bottom">
                <label>
                  <input
                    type="checkbox"
                    checked={section.included}
                    onChange={(e) =>
                      edit((p) => {
                        p.sections.find((s) => s.id === section.id)!.included =
                          e.target.checked;
                      })
                    }
                  />
                  Inclure dans le document
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={section.reviewed}
                    disabled={
                      !section.content.trim() || hasPlaceholder(section.content)
                    }
                    onChange={(e) =>
                      edit((p) => {
                        p.sections.find((s) => s.id === section.id)!.reviewed =
                          e.target.checked;
                      })
                    }
                  />
                  Rubrique relue
                </label>
                <span>
                  {section.content.trim()
                    ? section.content.trim().split(/\s+/).length
                    : 0}{" "}
                  mots
                </span>
              </div>
              {!section.included && (
                <p className="themis-hint">
                  Cette rubrique est conservée dans votre projet, mais exclue
                  des exports.
                </p>
              )}
              <div className="themis-next">
                <button
                  onClick={() => {
                    const next =
                      project.sections[project.sections.indexOf(section) + 1];
                    if (next) navigate(next.id);
                    else setView("requirements");
                  }}
                >
                  Continuer
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
          {view === "requirements" && (
            <div className="themis-requirements">
              <div className="themis-view-heading">
                <div>
                  <small>DU BESOIN À LA PREUVE</small>
                  <h1>Exigences</h1>
                  <p>
                    Un besoin précis, une priorité et un résultat vérifiable.
                  </p>
                </div>
                <button onClick={newRequirement}>
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>
              <div className="themis-requirement-filters">
                <label>
                  <Search size={15} />
                  <input
                    aria-label="Rechercher une exigence"
                    placeholder="Référence, titre, responsable…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Filtrer par priorité"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="">Toutes les priorités</option>
                  {priorities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="themis-requirement-layout">
                <div className="themis-requirement-list">
                  {project.requirements
                    .filter(
                      (r) =>
                        (!priority || r.priority === priority) &&
                        `${r.id} ${r.title} ${r.owner}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                    )
                    .map((r) => (
                      <button
                        key={r.id}
                        aria-pressed={r.id === selectedReq}
                        onClick={() => setSelectedReq(r.id)}
                      >
                        <small>
                          {r.id} · {r.priority}
                        </small>
                        <strong>{r.title || "Exigence sans titre"}</strong>
                        <span>
                          {r.status}
                          {!r.acceptance.trim() ? " · Recette à définir" : ""}
                        </span>
                      </button>
                    ))}
                  {!project.requirements.length && (
                    <p>
                      Aucune exigence pour le moment. Commencez par le besoin le
                      plus important.
                    </p>
                  )}
                </div>
                {requirement ? (
                  <div className="themis-requirement-form" key={requirement.id}>
                    <div className="themis-requirement-id">
                      <span>{requirement.id}</span>
                      <div>
                        <button
                          aria-label="Dupliquer l’exigence"
                          onClick={() => {
                            try {
                              let id = "";
                              edit((p) => {
                                id = addRequirement(p);
                                Object.assign(p.requirements.at(-1)!, {
                                  ...requirement,
                                  id,
                                  status: "Brouillon",
                                });
                              });
                              setSelectedReq(id);
                            } catch (e) {
                              setNotice((e as Error).message);
                            }
                          }}
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          aria-label="Supprimer l’exigence"
                          onClick={() => {
                            edit((p) => {
                              p.requirements = p.requirements.filter(
                                (r) => r.id !== requirement.id,
                              );
                              p.status = "Brouillon";
                            });
                            setSelectedReq(undefined);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <Field
                      label="Titre de l’exigence"
                      value={requirement.title}
                      onChange={(title) => patchReq({ title }, "title")}
                      placeholder="Ex. Exporter la liste des demandes"
                    />
                    <div className="themis-grid-two">
                      <label className="themis-field">
                        Nature
                        <select
                          value={requirement.type}
                          onChange={(e) =>
                            patchReq(
                              { type: e.target.value as Requirement["type"] },
                              "type",
                            )
                          }
                        >
                          {requirementTypes.map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      <label className="themis-field">
                        Priorité
                        <select
                          value={requirement.priority}
                          onChange={(e) =>
                            patchReq(
                              {
                                priority: e.target
                                  .value as Requirement["priority"],
                              },
                              "priority",
                            )
                          }
                        >
                          {priorities.map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <p className="themis-hint">
                      MoSCoW : indispensable, important, souhaitable ou
                      explicitement hors version.
                    </p>
                    <Field
                      label="Comportement attendu"
                      area
                      value={requirement.description}
                      onChange={(description) =>
                        patchReq({ description }, "description")
                      }
                      placeholder="Le système doit permettre à [profil] de [action], dans [conditions]."
                    />
                    <Field
                      label="Justification / objectif associé"
                      area
                      value={requirement.rationale}
                      onChange={(rationale) =>
                        patchReq({ rationale }, "rationale")
                      }
                      placeholder="Pourquoi ce besoin est-il nécessaire ?"
                    />
                    <Field
                      label="Critères de recette"
                      area
                      value={requirement.acceptance}
                      onChange={(acceptance) =>
                        patchReq({ acceptance }, "acceptance")
                      }
                      placeholder="Décrivez les données de test, l’action et le résultat observable attendu."
                    />
                    <button
                      disabled={!!requirement.acceptance.trim()}
                      onClick={() =>
                        patchReq(
                          {
                            acceptance:
                              "Étant donné [contexte et données]\nQuand [action réalisée]\nAlors [résultat observable et mesurable]",
                          },
                          "acceptance",
                        )
                      }
                    >
                      <Plus size={14} />
                      Trame de scénario de recette
                    </button>
                    <div className="themis-grid-two">
                      <Field
                        label="Responsable de validation"
                        value={requirement.owner}
                        onChange={(owner) => patchReq({ owner }, "owner")}
                      />
                      <label className="themis-field">
                        Statut
                        <select
                          value={requirement.status}
                          onChange={(e) =>
                            patchReq(
                              {
                                status: e.target.value as Requirement["status"],
                              },
                              "status",
                            )
                          }
                        >
                          <option>Brouillon</option>
                          <option>À valider</option>
                          <option>Validée</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="themis-selection-empty">
                    <ClipboardList size={30} strokeWidth={1} />
                    <h2>Des attentes testables.</h2>
                    <p>
                      Sélectionnez une exigence ou ajoutez-en une pour définir
                      son contenu et ses critères de recette.
                    </p>
                    <button onClick={newRequirement}>
                      <Plus size={16} />
                      Créer une exigence
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {view === "review" && (
            <div className="themis-review">
              <div className="themis-view-heading">
                <div>
                  <small>AVANT DE PARTAGER</small>
                  <h1>Relire et préciser</h1>
                  <p>
                    Ces contrôles repèrent les oublis courants. Ils ne
                    remplacent pas une validation métier.
                  </p>
                </div>
              </div>
              <div className="themis-review-summary">
                <span>
                  <strong>
                    {completed}/{included.length}
                  </strong>{" "}
                  rubriques renseignées
                </span>
                <span>
                  <strong>
                    {
                      project.requirements.filter(
                        (r) =>
                          r.acceptance.trim() && !hasPlaceholder(r.acceptance),
                      ).length
                    }
                    /{project.requirements.length}
                  </strong>{" "}
                  critères rédigés
                </span>
                <span>
                  <strong>{issues.length}</strong> points à examiner
                </span>
              </div>
              <div className="themis-review-list">
                {issues.map((issue, i) => (
                  <button
                    key={`${issue.target}-${i}`}
                    onClick={() => navigate(issue.target)}
                  >
                    <span>
                      {issue.level === "missing" ? "À compléter" : "À revoir"}
                    </span>
                    <p>{issue.message}</p>
                    <ArrowRight size={15} />
                  </button>
                ))}
                {!issues.length && (
                  <p>
                    Les contrôles de complétude sont satisfaits. Faites relire
                    et approuver le document par les parties prenantes.
                  </p>
                )}
              </div>
              <div className="themis-principles">
                <h2>Avant validation</h2>
                <ul>
                  <li>
                    Chaque exigence porte sur un besoin précis et dispose d’une
                    preuve de recette.
                  </li>
                  <li>
                    Les priorités, exclusions, hypothèses et responsabilités
                    sont explicites.
                  </li>
                  <li>
                    Les seuils et engagements ont été acceptés par les personnes
                    concernées.
                  </li>
                </ul>
                <button onClick={() => setDialog("metadata")}>
                  Mettre à jour le statut du document
                </button>
              </div>
            </div>
          )}
          {view === "preview" && (
            <div className="themis-preview">
              <div className="themis-preview-toolbar">
                <p>
                  Aperçu de structure · La pagination est calculée dans Word ou
                  Google Docs.
                </p>
                <button onClick={() => setDialog("word")}>
                  <Download size={15} />
                  Exporter
                </button>
              </div>
              <DocumentPreview project={project} options={options} />
            </div>
          )}
        </section>
      </div>
      <footer className="themis-status">
        <span>
          {dirty ? "Modifications à enregistrer" : "Projet en mémoire"}
        </span>
        <span role="status">{notice}</span>
        <span>Sans compte · Fichiers locaux</span>
      </footer>
      <input
        ref={fileInput}
        type="file"
        accept=".atlas.json,.json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            if (file.size > 5_000_000)
              throw new Error("Fichier trop volumineux (5 Mo maximum).");
            const p = parseProject(JSON.parse(await file.text()));
            if (
              useThemis.getState().dirty &&
              !(await confirm(
                "L’import remplacera votre document actuel. Enregistrez le fichier projet avant de continuer pour conserver vos modifications.",
              ))
            )
              return;
            replace(p);
            setActive(p.sections[0]!.id);
            setSelectedReq(undefined);
            setView("write");
            setNotice("Projet Thémis importé.");
          } catch (e) {
            setNotice(
              e instanceof Error && !("issues" in e)
                ? e.message
                : "Fichier Thémis invalide ou version non prise en charge.",
            );
          }
        }}
      />
      <Modal
        open={dialog === "metadata"}
        onClose={() => setDialog(null)}
        title="Informations du document"
        className="themis-modal"
      >
        <div className="themis-modal-content">
          <Field
            label="Nom du projet"
            value={project.name}
            onChange={(name) => meta({ name }, "name")}
          />
          <div className="themis-grid-two">
            <Field
              label="Commanditaire"
              value={project.client}
              onChange={(client) => meta({ client }, "client")}
            />
            <Field
              label="Rédacteur"
              value={project.author}
              onChange={(author) => meta({ author }, "author")}
            />
            <Field
              label="Version"
              value={project.version}
              onChange={(version) => meta({ version }, "version")}
            />
            <label className="themis-field">
              Date
              <input
                type="date"
                value={project.date}
                onChange={(e) => meta({ date: e.target.value }, "date")}
              />
            </label>
            <label className="themis-field">
              Statut
              <select
                value={project.status}
                onChange={(e) =>
                  meta(
                    { status: e.target.value as SpecProject["status"] },
                    "status",
                  )
                }
              >
                <option>Brouillon</option>
                <option>En relecture</option>
                <option>Validé</option>
              </select>
            </label>
            <label className="themis-field">
              Diffusion
              <select
                value={project.confidentiality}
                onChange={(e) =>
                  meta(
                    {
                      confidentiality: e.target
                        .value as SpecProject["confidentiality"],
                    },
                    "confidentiality",
                  )
                }
              >
                <option>Interne</option>
                <option>Public</option>
                <option>Confidentiel</option>
              </select>
            </label>
          </div>
          <p className="themis-hint">
            Le statut « Validé » est une déclaration manuelle après accord des
            parties prenantes. Il ne constitue pas une signature électronique.
          </p>
        </div>
      </Modal>
      <Modal
        open={dialog === "new"}
        onClose={() => setDialog(null)}
        title="Choisir une trame"
        className="themis-modal"
      >
        <div className="themis-modal-content">
          <p>
            Les modèles apportent un plan et des questions adaptées. Votre
            contenu reste à rédiger.
          </p>
          {templates.map((t) => (
            <button
              className="themis-template"
              key={t.id}
              onClick={() => {
                setDialog(null);
                void start(t.id);
              }}
            >
              <div>
                <strong>{t.name}</strong>
                <span>{t.description}</span>
              </div>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
      </Modal>
      <Modal
        open={dialog === "word" || dialog === "google"}
        onClose={() => setDialog(null)}
        title={
          dialog === "google"
            ? "Exporter pour Google Docs"
            : "Exporter le cahier des charges"
        }
        className="themis-modal"
      >
        <div className="themis-modal-content">
          <p>
            Un document éditable avec page de garde, sommaire, titres
            hiérarchisés, listes, tableau des exigences et numéros de page.
          </p>
          <div className="themis-export-options">
            <label>
              <input
                type="checkbox"
                checked={options.cover}
                onChange={(e) =>
                  setOptions({ ...options, cover: e.target.checked })
                }
              />
              Page de garde séparée
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.contents}
                onChange={(e) =>
                  setOptions({ ...options, contents: e.target.checked })
                }
              />
              Sommaire cliquable
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.includeEmpty}
                onChange={(e) =>
                  setOptions({ ...options, includeEmpty: e.target.checked })
                }
              />
              Inclure les rubriques vides
            </label>
            <label className="themis-field">
              Format du papier
              <select
                value={options.pageSize}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    pageSize: e.target.value as ExportOptions["pageSize"],
                  })
                }
              >
                <option>Letter</option>
                <option>A4</option>
              </select>
            </label>
          </div>
          {issues.some((i) => i.level === "missing") && (
            <p className="themis-hint">
              Des éléments restent à compléter. Vous pouvez exporter un
              brouillon ou passer par Relecture avant diffusion.
            </p>
          )}
          {dialog === "google" && (
            <div className="themis-google-guide">
              <h3>Dans Google Docs</h3>
              <ol>
                <li>Téléchargez le fichier Word ci-dessous.</li>
                <li>
                  Importez-le dans Google Drive, puis ouvrez-le avec Google
                  Docs.
                </li>
                <li>
                  Pour convertir : Fichier → Enregistrer au format Google Docs.
                </li>
              </ol>
              <p>
                La structure utilise des styles et tableaux standards. Vérifiez
                les sauts de page après conversion : une mise en page
                strictement identique n’est pas garantie.
              </p>
              <a
                href="https://support.google.com/docs/answer/9406611?hl=fr"
                target="_blank"
                rel="noreferrer"
              >
                Guide officiel Google
              </a>
            </div>
          )}
          <button
            className="themis-download"
            disabled={busy || !project.name.trim()}
            onClick={() => void exportWord()}
          >
            <Download size={16} />
            {busy ? "Préparation…" : "Télécharger le document .docx"}
          </button>
          <p className="themis-hint">
            Ce téléchargement ne sauvegarde pas le projet Thémis. Conservez
            aussi le fichier .atlas.json.
          </p>
        </div>
      </Modal>
    </div>
  );
}
