"use client";
import { useEffect, useRef, useState } from "react";
import {
  MessageSquareText,
  Copy,
  Download,
  FolderOpen,
  Library,
  Undo2,
  Redo2,
  ArrowUpRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Dropdown, Modal, useConfirmation } from "@atlas/ui";
import { useMetis } from "./store";
import {
  fields,
  templates,
  createProject,
  composePrompt,
  reviewPrompt,
  parseProject,
  serializeProject,
  starterBlocks,
  insertBlock,
  type FieldId,
  type TemplateId,
  type Block,
} from "./model";
import "./metis.css";
function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const filename = (name: string) =>
  name
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .slice(0, 120) || "Mon-prompt";
export function Metis() {
  const { project, dirty, past, future, edit, replace, saved, undo, redo } =
    useMetis();
  const [active, setActive] = useState<FieldId>("objective");
  const [pane, setPane] = useState<"write" | "preview">("write");
  const [modal, setModal] = useState<"templates" | "blocks" | "review" | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const [blockName, setBlockName] = useState("");
  const [blockContent, setBlockContent] = useState("");
  const [blockTarget, setBlockTarget] = useState<FieldId>("context");
  const [blockSearch, setBlockSearch] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const preview = useRef<HTMLTextAreaElement>(null);
  const { confirm, confirmationDialog } = useConfirmation();
  const prompt = composePrompt(project);
  const issues = reviewPrompt(project);
  const guide = fields.find((f) => f.id === active)!;
  const template = templates.find((t) => t.id === project.template)!;
  const example =
    active === "objective"
      ? template.objective
      : active === "output"
        ? template.output
        : active === "constraints"
          ? template.constraints
          : guide.example;
  const words = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const blocks = [
    ...starterBlocks.map((b, i) => ({
      ...b,
      id: `starter-${i}`,
      personal: false,
    })),
    ...project.blocks.map((b) => ({ ...b, personal: true })),
  ].filter((b) =>
    (b.name + " " + b.content)
      .toLocaleLowerCase("fr")
      .includes(blockSearch.toLocaleLowerCase("fr")),
  );
  function changeField(id: FieldId, text: string) {
    edit({ ...project, values: { ...project.values, [id]: text } }, id);
  }
  function save() {
    try {
      download(
        serializeProject(project),
        `${filename(project.name)}.atlas.json`,
        "application/json",
      );
      saved();
      setNotice(
        "Projet téléchargé. Conservez ce fichier pour reprendre votre travail.",
      );
    } catch {
      setNotice("Renseignez un nom de projet avant de l’enregistrer.");
    }
  }
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  async function load(file?: File) {
    if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024)
        throw new Error("Le fichier dépasse 8 Mo.");
      const next = parseProject(JSON.parse(await file.text()));
      if (
        dirty &&
        !(await confirm(
          "L’import remplacera le prompt et les blocs actuels. Enregistrez votre projet si vous souhaitez les conserver.",
        ))
      )
        return;
      replace(next);
      setActive("objective");
      setNotice("Projet importé.");
    } catch {
      setNotice(
        "Import impossible : fichier Métis invalide, incompatible ou supérieur à 8 Mo.",
      );
    }
  }
  async function newProject(id: TemplateId) {
    setModal(null);
    if (
      dirty &&
      !(await confirm(
        "Le nouveau projet remplacera le prompt et les blocs actuels. Vous pouvez d’abord les enregistrer.",
      ))
    )
      return;
    replace(createProject(id));
    setActive("objective");
    setPane("write");
    setNotice(
      "Projet créé. Les exemples sont des suggestions, pas du contenu ajouté automatiquement.",
    );
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setNotice("Prompt copié.");
    } catch {
      setPane("preview");
      setNotice(
        "Copie automatique indisponible. Sélectionnez le prompt dans l’aperçu, puis copiez-le avec Ctrl+C.",
      );
      requestAnimationFrame(() => {
        preview.current?.focus();
        preview.current?.select();
      });
    }
  }
  function applyBlock(block: Pick<Block, "target" | "content">) {
    try {
      edit(insertBlock(project, block));
      setActive(block.target);
      setPane("write");
      setModal(null);
      setNotice("Bloc ajouté au champ. Vous pouvez annuler cette insertion.");
    } catch {
      setNotice(
        "Insertion impossible : limite de 30 000 caractères par champ.",
      );
    }
  }
  function saveBlock() {
    if (!blockName.trim() || !blockContent.trim()) return;
    if (project.blocks.length >= 50) {
      setNotice("La bibliothèque est limitée à 50 blocs.");
      return;
    }
    edit({
      ...project,
      blocks: [
        ...project.blocks,
        {
          id: crypto.randomUUID(),
          name: blockName.trim(),
          content: blockContent.trim(),
          target: blockTarget,
        },
      ],
    });
    setBlockName("");
    setBlockContent("");
    setNotice(
      "Bloc enregistré dans ce projet. Exportez le fichier JSON pour le conserver.",
    );
  }
  const focusIssue = (id: FieldId) => {
    setActive(id);
    setPane("write");
    setModal(null);
    requestAnimationFrame(() => editor.current?.focus());
  };
  return (
    <div
      className="metis-workspace"
      onKeyDown={(e) => {
        if (
          !(e.ctrlKey || e.metaKey) ||
          document.querySelector('dialog[open],[role="dialog"]')
        )
          return;
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          save();
        }
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
          return;
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        }
      }}
    >
      <header className="metis-header">
        <h1>
          <MessageSquareText size={20} /> Métis
        </h1>
        <input
          aria-label="Nom du projet"
          value={project.name}
          maxLength={200}
          onChange={(e) => edit({ ...project, name: e.target.value }, "name")}
        />
        <div className="metis-actions">
          <button
            title="Annuler"
            aria-label="Annuler"
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={15} />
          </button>
          <button
            title="Rétablir"
            aria-label="Rétablir"
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={15} />
          </button>
          <Dropdown
            className="metis-menu"
            trigger={
              <>
                <FolderOpen size={15} /> Projet
              </>
            }
          >
            <button onClick={() => setModal("templates")}>
              Nouveau projet
            </button>
            <button onClick={save}>Enregistrer le projet (.atlas.json)</button>
            <button onClick={() => input.current?.click()}>
              Importer un projet
            </button>
          </Dropdown>
          <Dropdown
            className="metis-menu"
            trigger={
              <>
                <Download size={15} /> Export
              </>
            }
          >
            <button
              disabled={!prompt}
              onClick={() => {
                download(
                  prompt,
                  `${filename(project.name)}.md`,
                  "text/markdown;charset=utf-8",
                );
                setNotice(
                  "Prompt Markdown téléchargé. Le JSON conserve les champs et les blocs.",
                );
              }}
            >
              Télécharger le Markdown
            </button>
            <button
              disabled={!prompt}
              onClick={() => {
                download(
                  prompt,
                  `${filename(project.name)}.txt`,
                  "text/plain;charset=utf-8",
                );
                setNotice("Prompt texte téléchargé.");
              }}
            >
              Télécharger le texte
            </button>
          </Dropdown>
        </div>
      </header>
      <input
        hidden
        type="file"
        accept=".json,.atlas.json"
        ref={input}
        onChange={(e) => {
          void load(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="metis-toolbar">
        <label>
          Usage{" "}
          <select
            value={project.template}
            onChange={(e) =>
              edit({ ...project, template: e.target.value as TemplateId })
            }
          >
            {templates.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setModal("blocks")}>
          <Library size={15} /> Blocs
        </button>
        <button onClick={() => setModal("review")}>
          Relecture <span>{issues.length}</span>
        </button>
        <div className="metis-mobile-tabs">
          <button
            aria-pressed={pane === "write"}
            onClick={() => setPane("write")}
          >
            Rédiger
          </button>
          <button
            aria-pressed={pane === "preview"}
            onClick={() => setPane("preview")}
          >
            Aperçu
          </button>
        </div>
      </div>
      <div className={`metis-body metis-pane-${pane}`}>
        <section className="metis-editor" aria-label="Rédaction guidée">
          <div className="metis-intro">
            <span>ATELIER DE PROMPTS</span>
            <h2>Une intention. Des consignes claires.</h2>
            <p>
              Précisez ce qui compte. Métis assemble vos mots, sans IA et sans
              envoi de vos données.
            </p>
          </div>
          <nav className="metis-fields" aria-label="Rubriques du prompt">
            {fields.map((f, i) => (
              <button
                key={f.id}
                aria-current={active === f.id ? "step" : undefined}
                onClick={() => setActive(f.id)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {f.title}
                {project.values[f.id].trim() && (
                  <span className="metis-filled" aria-label="renseigné">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="metis-field-heading">
            <label htmlFor="metis-input">{guide.title}</label>
            <span>
              {project.values[active].length.toLocaleString("fr-FR")} / 30 000
            </span>
          </div>
          <p className="metis-hint">{guide.hint}</p>
          <textarea
            id="metis-input"
            ref={editor}
            value={project.values[active]}
            onChange={(e) => changeField(active, e.target.value)}
            maxLength={30000}
            placeholder="Écrivez ici…"
            spellCheck
          />
          <details className="metis-example" key={project.template + active}>
            <summary>Un exemple pour démarrer</summary>
            <p>{example}</p>
            <button
              onClick={() => applyBlock({ target: active, content: example })}
            >
              <Plus size={14} /> Insérer cet exemple
            </button>
          </details>
          <div className="metis-editor-footer">
            <button
              disabled={!project.values[active].trim()}
              onClick={() => {
                setBlockName(guide.title);
                setBlockContent(project.values[active]);
                setBlockTarget(active);
                setModal("blocks");
              }}
            >
              Garder ce champ comme bloc
            </button>
            <button
              onClick={() =>
                setActive(
                  fields[
                    (fields.findIndex((f) => f.id === active) + 1) %
                      fields.length
                  ]!.id,
                )
              }
            >
              Rubrique suivante <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
        <section className="metis-preview" aria-label="Aperçu du prompt">
          <div className="metis-preview-heading">
            <div>
              <span>VOTRE PROMPT</span>
              <h2>Prêt à transmettre.</h2>
            </div>
            <button
              className="metis-copy"
              disabled={!prompt}
              onClick={() => void copy()}
            >
              <Copy size={15} /> Copier
            </button>
          </div>
          <div className="metis-output-options">
            <div role="group" aria-label="Présentation du prompt">
              <button
                aria-pressed={project.mode === "detailed"}
                onClick={() => edit({ ...project, mode: "detailed" })}
              >
                Détaillé
              </button>
              <button
                aria-pressed={project.mode === "compact"}
                onClick={() => edit({ ...project, mode: "compact" })}
              >
                Compact
              </button>
            </div>
            <span>
              {words} mots · {prompt.length.toLocaleString("fr-FR")} caractères
            </span>
          </div>
          <textarea
            ref={preview}
            readOnly
            aria-label="Prompt généré"
            value={prompt}
            placeholder="Votre prompt prendra forme ici. Commencez par décrire l’objectif."
            spellCheck={false}
          />
          <p className="metis-preview-note">
            {project.mode === "compact"
              ? "Présentation allégée, toutes vos consignes conservées."
              : "Sections Markdown copiables dans l’assistant de votre choix."}{" "}
            Aucun modèle ne reçoit ce texte depuis Atlas.
          </p>
        </section>
      </div>
      <footer className="metis-status">
        <span role="status">
          {notice ||
            "Vos projets restent dans vos fichiers. Pensez à enregistrer avant de quitter."}
        </span>
        <span>
          {dirty ? "Modifications à enregistrer" : "Projet en mémoire"}
        </span>
      </footer>
      <Modal
        open={modal === "templates"}
        onClose={() => setModal(null)}
        title="Nouveau prompt"
        className="metis-modal"
      >
        <p>
          Choisissez un usage. Les exemples vous guideront ; les champs restent
          à rédiger.
        </p>
        <div className="metis-template-grid">
          {templates.map((t) => (
            <button key={t.id} onClick={() => void newProject(t.id)}>
              <strong>{t.name}</strong>
              <span>{t.summary}</span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
      </Modal>
      <Modal
        open={modal === "review"}
        onClose={() => setModal(null)}
        title="Relire le prompt"
        className="metis-modal"
      >
        <p>
          Ces repères signalent des oublis et quelques ambiguïtés. Ils ne
          garantissent pas la qualité de la réponse et ne détectent pas toutes
          les contradictions.
        </p>
        {issues.length ? (
          <ul className="metis-issues">
            {issues.map((issue, i) => (
              <li key={i}>
                <button onClick={() => focusIssue(issue.field)}>
                  <strong>
                    {fields.find((f) => f.id === issue.field)!.title}
                  </strong>
                  <span>{issue.message}</span>
                  <ArrowUpRight size={15} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="metis-empty">
            Aucun point détecté par ces contrôles. Relisez les faits, les
            contraintes et les exemples avant de copier.
          </p>
        )}
      </Modal>
      <Modal
        open={modal === "blocks"}
        onClose={() => setModal(null)}
        title="Bibliothèque de blocs"
        className="metis-modal"
      >
        <p>
          Ajoutez un bloc au champ associé. Vos blocs personnels sont conservés
          dans le fichier du projet, pas sur le site.
        </p>
        <input
          aria-label="Rechercher un bloc"
          placeholder="Rechercher un bloc…"
          value={blockSearch}
          onChange={(e) => setBlockSearch(e.target.value)}
        />
        <div className="metis-block-list">
          {!blocks.length && <p>Aucun bloc ne correspond à la recherche.</p>}
          {blocks.map((b) => (
            <article key={`${b.personal}-${b.id}`}>
              <div>
                <strong>{b.name}</strong>
                <small>
                  {fields.find((f) => f.id === b.target)!.title}
                  {b.personal ? " · Personnel" : " · Suggestion"}
                </small>
                <p>{b.content}</p>
              </div>
              <div className="metis-block-actions">
                <button onClick={() => applyBlock(b)}>Insérer</button>
                {b.personal && (
                  <button
                    aria-label={`Supprimer ${b.name}`}
                    onClick={() => {
                      edit({
                        ...project,
                        blocks: project.blocks.filter((x) => x.id !== b.id),
                      });
                      setNotice(
                        "Bloc supprimé. Annuler permet de le restaurer.",
                      );
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        <form
          className="metis-block-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveBlock();
          }}
        >
          <h3>Créer un bloc réutilisable</h3>
          <label>
            Nom
            <input
              required
              maxLength={100}
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
            />
          </label>
          <label>
            Rubrique
            <select
              value={blockTarget}
              onChange={(e) => setBlockTarget(e.target.value as FieldId)}
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </label>
          <label className="metis-block-content">
            Contenu
            <textarea
              required
              maxLength={30000}
              value={blockContent}
              onChange={(e) => setBlockContent(e.target.value)}
            />
          </label>
          <button
            disabled={
              !blockName.trim() ||
              !blockContent.trim() ||
              project.blocks.length >= 50
            }
            type="submit"
          >
            Enregistrer le bloc
          </button>
        </form>
      </Modal>
      {confirmationDialog}
    </div>
  );
}
