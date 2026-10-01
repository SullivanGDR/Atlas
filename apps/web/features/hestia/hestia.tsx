"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Palette,
  Undo2,
  Redo2,
  Download,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Dropdown, Modal, useConfirmation } from "@atlas/ui";
import { useHestia } from "./store";
import {
  applyStyle,
  styles,
  palettes,
  typography,
  tokens,
  tokenKeys,
  contrastAudit,
  colorRamp,
  harmonies,
  designValues,
  exportCss,
  exportHtml,
  exportTokens,
  createProject,
  serializeProject,
  parseProject,
  readableOn,
  type HestiaProject,
  type TokenKey,
} from "./model";
import "./hestia.css";
import "./studio.css";

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const filename = (name: string) =>
  name
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .slice(0, 80) || "hestia";
const sections = [
  ["style", "Directions"],
  ["palette", "Couleurs"],
  ["type", "Typographie"],
  ["layout", "Géométrie"],
  ["tokens", "Rôles"],
] as const;
type Section = (typeof sections)[number][0];

export function Hestia() {
  const { project, dirty, past, future, edit, replace, saved, undo, redo } =
    useHestia();
  const [section, setSection] = useState<Section>("style");
  const [view, setView] = useState<"components" | "landing" | "tokens">(
    "components",
  );
  const [collapsed, setCollapsed] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { confirm, confirmationDialog } = useConfirmation();
  const colors = tokens(project),
    values = designValues(project);
  const audit = contrastAudit(project);
  const font = typography.find((t) => t.id === project.typography)!;
  const update = (patch: Partial<HestiaProject>) =>
    edit({ ...project, ...patch });
  function save() {
    try {
      download(
        serializeProject(project),
        filename(project.name) + ".atlas.json",
        "application/json",
      );
      saved();
      setNotice(
        "Projet téléchargé. Conservez ce fichier pour reprendre votre travail.",
      );
    } catch {
      setNotice("Indiquez un nom de projet valide.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(exportCss(project));
      setNotice("Variables CSS copiées.");
    } catch {
      setCodeOpen(true);
      setNotice("Sélectionnez le code pour le copier.");
    }
  }
  async function load(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error("Fichier trop volumineux");
      const next = parseProject(JSON.parse(await file.text()));
      if (
        dirty &&
        !(await confirm(
          "Importer remplacera le projet actuel. Enregistrez-le pour conserver vos modifications.",
        ))
      )
        return;
      replace(next);
      setNotice("Projet Hestia importé.");
    } catch {
      setNotice(
        "Import impossible : fichier Hestia invalide ou supérieur à 1 Mo.",
      );
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
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        try {
          download(
            serializeProject(project),
            filename(project.name) + ".atlas.json",
            "application/json",
          );
          saved();
          setNotice("Projet téléchargé.");
        } catch {
          setNotice("Indiquez un nom de projet valide.");
        }
      } else if (
        e.key.toLowerCase() === "z" &&
        !(e.target as HTMLElement)?.closest("input,textarea,select")
      ) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [project, saved, undo, redo]);
  const boardStyle = Object.fromEntries([
    ...Object.entries(colors).map(([key, value]) => [
      "--h-" + key.replace(/[A-Z]/g, (s) => "-" + s.toLowerCase()),
      value,
    ]),
    ["--hestia-radius", project.radius + "px"],
    ["--hestia-shadow", values.shadow],
    ["--h-text", values.text + "px"],
    ["--h-heading", values.heading + "px"],
    ["--h-spacing", values.space + "px"],
    ["--h-stroke", values.borderWidth + "px"],
    ["fontFamily", font.sans],
  ]) as CSSProperties;
  function setToken(key: TokenKey, value: string) {
    update({
      overrides: {
        ...project.overrides,
        [project.mode]: { ...project.overrides[project.mode], [key]: value },
      },
    });
  }
  return (
    <div
      className={`hestia-workspace studio ${collapsed ? "is-collapsed" : ""}`}
    >
      <header className="hestia-header">
        <div className="hestia-brand">
          <Palette size={19} />
          <h1>Hestia</h1>
        </div>
        <input
          aria-label="Nom du design system"
          maxLength={120}
          value={project.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <div className="hestia-actions">
          <button aria-label="Annuler" onClick={undo} disabled={!past.length}>
            <Undo2 size={15} />
          </button>
          <button
            aria-label="Rétablir"
            onClick={redo}
            disabled={!future.length}
          >
            <Redo2 size={15} />
          </button>
          <Dropdown
            className="hestia-menu"
            trigger={
              <>
                <FolderOpen size={15} /> Projet
              </>
            }
          >
            <button onClick={save}>Enregistrer le projet JSON</button>
            <button onClick={() => input.current?.click()}>
              Importer un projet
            </button>
            <button
              onClick={async () => {
                if (
                  !dirty ||
                  (await confirm(
                    "Créer un nouveau design system remplacera votre projet actuel.",
                  ))
                )
                  replace(createProject());
              }}
            >
              Nouveau projet
            </button>
          </Dropdown>
          <Dropdown
            className="hestia-menu"
            trigger={
              <>
                <Download size={15} /> Export
              </>
            }
          >
            <button
              onClick={() =>
                download(
                  exportCss(project),
                  filename(project.name) + ".css",
                  "text/css",
                )
              }
            >
              Variables CSS · deux thèmes
            </button>
            <button
              onClick={() =>
                download(
                  exportTokens(project),
                  filename(project.name) + ".tokens.json",
                  "application/json",
                )
              }
            >
              Tokens JSON · intégration
            </button>
            <button
              onClick={() =>
                download(
                  exportHtml(project),
                  filename(project.name) + ".html",
                  "text/html",
                )
              }
            >
              Page HTML autonome
            </button>
            <button onClick={copy}>Copier les variables CSS</button>
            <button onClick={() => setCodeOpen(true)}>Afficher le code</button>
          </Dropdown>
          <input
            ref={input}
            hidden
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              void load(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </header>
      <div className="hestia-body">
        <aside className="hestia-library" aria-label="Bibliothèque Hestia">
          <div className="hestia-library-title">
            <span>Votre direction visuelle</span>
            <button
              aria-label="Masquer la bibliothèque"
              onClick={() => setCollapsed(true)}
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <nav className="hestia-sections" aria-label="Fondations">
            {sections.map(([id, label]) => (
              <button
                key={id}
                aria-pressed={section === id}
                className={section === id ? "is-selected" : ""}
                onClick={() => setSection(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="hestia-library-content">
            {section === "style" && (
              <>
                <p className="hestia-help">
                  Commencez par une direction complète. Affinez ensuite les
                  couleurs, la typographie et les composants.
                </p>
                {styles.map((s) => (
                  <button
                    key={s.id}
                    className={`hestia-palette hestia-direction ${project.style === s.id ? "is-selected" : ""}`}
                    onClick={async () => {
                      if (
                        !dirty ||
                        (await confirm(
                          "Cette direction remplacera vos réglages visuels et couleurs personnalisées. Vous pourrez annuler.",
                        ))
                      )
                        edit(applyStyle(project, s.id));
                    }}
                  >
                    <span
                      className={`direction-art direction-${s.id}`}
                      style={{
                        fontFamily: typography.find(
                          (t) => t.id === s.typography,
                        )!.sans,
                      }}
                    >
                      <b>Aa</b>
                      <i />
                      <i />
                    </span>
                    <strong>{s.name}</strong>
                    <small>{s.description}</small>
                  </button>
                ))}
              </>
            )}
            {section === "palette" && (
              <>
                <p className="hestia-help">
                  12 palettes de départ. Choisir une palette réinitialise les
                  rôles personnalisés ; Annuler restaure vos réglages.
                </p>
                <input
                  className="hestia-search"
                  aria-label="Rechercher une palette"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="hestia-palette-list">
                  {palettes
                    .filter((p) =>
                      (p.name + p.description)
                        .toLocaleLowerCase("fr")
                        .includes(search.toLocaleLowerCase("fr")),
                    )
                    .map((p) => (
                      <button
                        key={p.id}
                        className={`hestia-palette ${project.palette === p.id ? "is-selected" : ""}`}
                        onClick={() =>
                          update({
                            palette: p.id,
                            customAccent: p.accent,
                            darkAccent: undefined,
                            overrides: { light: {}, dark: {} },
                          })
                        }
                      >
                        <span className="hestia-swatch-row">
                          {[...p.swatches, p.accent].map((c, i) => (
                            <i key={i} style={{ background: c }} />
                          ))}
                        </span>
                        <strong>{p.name}</strong>
                        <small>{p.description}</small>
                      </button>
                    ))}
                </div>
                <label className="hestia-field">
                  <span>Marque · thème clair</span>
                  <div className="hestia-color-input">
                    <input
                      type="color"
                      value={project.customAccent}
                      onChange={(e) => update({ customAccent: e.target.value })}
                    />
                    <code>{project.customAccent}</code>
                  </div>
                </label>
                <label className="hestia-field">
                  <span>Marque · thème sombre</span>
                  <input
                    type="color"
                    value={
                      project.darkAccent ??
                      tokens(
                        { ...project, overrides: { light: {}, dark: {} } },
                        "dark",
                      ).brand
                    }
                    onChange={(e) => update({ darkAccent: e.target.value })}
                  />
                </label>
                <p className="hestia-label">Associations suggérées</p>
                {harmonies(project.customAccent).map((h) => (
                  <div className="hestia-harmony" key={h.name}>
                    <small>{h.name}</small>
                    <div>
                      {h.colors.map((c, i) => (
                        <button
                          key={i}
                          title={"Utiliser " + c}
                          style={{ background: c, color: readableOn(c) }}
                          onClick={() =>
                            update({ customAccent: c, darkAccent: undefined })
                          }
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="hestia-help">
                  Une harmonie suggère une association ; son contraste dépend de
                  l’usage.
                </p>
              </>
            )}
            {section === "type" && (
              <>
                <p className="hestia-help">
                  Trois familles réellement distinctes. Aucune police distante
                  n’est chargée.
                </p>
                <div className="hestia-type-list">
                  {typography.map((t) => (
                    <button
                      className={`hestia-type ${project.typography === t.id ? "is-selected" : ""}`}
                      key={t.id}
                      style={{ fontFamily: t.sans }}
                      onClick={() => update({ typography: t.id })}
                    >
                      <span className="hestia-type-sample">Aa</span>
                      <strong>{t.name}</strong>
                      <small>{t.description}</small>
                    </button>
                  ))}
                </div>
                <label className="hestia-field">
                  <span>Densité & échelle</span>
                  <select
                    value={project.scale}
                    onChange={(e) =>
                      update({
                        scale: e.target.value as HestiaProject["scale"],
                      })
                    }
                  >
                    <option value="compact">Compacte · 14px</option>
                    <option value="standard">Standard · 15px</option>
                    <option value="airy">Aérée · 16px</option>
                  </select>
                </label>
                <p className="hestia-help">
                  Les tailles, espacements et hauteurs des composants suivent
                  cette échelle.
                </p>
              </>
            )}
            {section === "layout" && (
              <>
                <label className="hestia-field">
                  <span>
                    Arrondi <output>{project.radius}px</output>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={project.radius}
                    onChange={(e) => update({ radius: Number(e.target.value) })}
                  />
                </label>
                <label className="hestia-field">
                  <span>Profondeur</span>
                  <select
                    value={project.shadow}
                    onChange={(e) =>
                      update({
                        shadow: e.target.value as HestiaProject["shadow"],
                      })
                    }
                  >
                    <option value="none">Aucune</option>
                    <option value="soft">Discrète</option>
                    <option value="elevated">Élevée</option>
                  </select>
                </label>
                <div className="hestia-radius-preview">
                  {[1, 2, 3].map((n) => (
                    <span key={n} style={{ borderRadius: project.radius }} />
                  ))}
                </div>
                <p className="hestia-help">
                  Contrôlez le résultat dans Composants, Page exemple et
                  Fondations.
                </p>
              </>
            )}
            {section === "tokens" && (
              <>
                <p className="hestia-help">
                  Rôles du thème {project.mode === "light" ? "clair" : "sombre"}
                  . Personnalisez chaque couleur indépendamment.
                </p>
                {tokenKeys.map((key) => (
                  <label className="hestia-token-field" key={key}>
                    <code>{key}</code>
                    <input
                      type="color"
                      aria-label={"Couleur " + key}
                      value={colors[key]}
                      onChange={(e) => setToken(key, e.target.value)}
                    />
                    <span>{colors[key]}</span>
                  </label>
                ))}
                <button
                  onClick={() =>
                    update({
                      overrides: { ...project.overrides, [project.mode]: {} },
                    })
                  }
                >
                  Réinitialiser les rôles de ce thème
                </button>
              </>
            )}
          </div>
          <div className="hestia-library-foot">
            <span>Atlas / Hestia</span>
            <span>{dirty ? "À enregistrer" : "En mémoire"}</span>
          </div>
        </aside>
        <div className="hestia-main">
          <div className="hestia-mainbar">
            <div>
              <span className="hestia-eyebrow">ATELIER / DESIGN SYSTEM</span>
              <h2>{project.name || "Sans titre"}</h2>
              <p className="hestia-help">
                {styles.find((s) => s.id === project.style)!.name} ·{" "}
                {palettes.find((p) => p.id === project.palette)!.name} ·{" "}
                {font.name}
              </p>
            </div>
            <div className="hestia-mode">
              {collapsed && (
                <button
                  aria-label="Afficher la bibliothèque"
                  onClick={() => setCollapsed(false)}
                >
                  <PanelLeftOpen size={16} />
                </button>
              )}
              {(["light", "dark"] as const).map((m) => (
                <button
                  key={m}
                  aria-pressed={project.mode === m}
                  className={project.mode === m ? "is-selected" : ""}
                  onClick={() => update({ mode: m })}
                >
                  {m === "light" ? "Clair" : "Sombre"}
                </button>
              ))}
            </div>
          </div>
          <nav className="hestia-views" aria-label="Vues de la planche">
            {(
              [
                ["components", "Composants"],
                ["landing", "Page exemple"],
                ["tokens", "Fondations"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={view === id}
                onClick={() => setView(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <section
            className={`hestia-board style-${project.style}`}
            style={boardStyle}
            aria-label="Aperçu du design system"
          >
            {view === "tokens" ? (
              <>
                <span className="hestia-board-kicker">FONDATIONS</span>
                <h3>Une identité qui se décline.</h3>
                <div className="hestia-ramp">
                  {colorRamp(project.customAccent).map((s) => (
                    <div key={s.step}>
                      <i style={{ background: s.color }} />
                      <code>{s.step}</code>
                      <small>{s.color}</small>
                    </div>
                  ))}
                </div>
                <h4>Hiérarchie typographique</h4>
                {[
                  values.heading * 1.5,
                  values.heading,
                  20,
                  values.text,
                  12,
                ].map((size, i) => (
                  <p key={i} style={{ fontSize: size, margin: "12px 0" }}>
                    Aa —{" "}
                    {
                      [
                        "Titre principal",
                        "Titre de section",
                        "Sous-titre",
                        "Corps de texte",
                        "Légende",
                      ][i]
                    }{" "}
                    · {size}px
                  </p>
                ))}
                <h4>Rythme & espacement</h4>
                <div className="hestia-spacing">
                  {[1, 2, 3, 4, 6, 8].map((n) => (
                    <div key={n}>
                      <i style={{ width: values.space * n }} />
                      <code>{values.space * n}px</code>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {view === "landing" && (
                  <div className="hestia-demo-nav">
                    <strong>Studio / {project.name}</strong>
                    <span>Produit · Ressources · À propos</span>
                  </div>
                )}
                <div className="hestia-board-head">
                  <div>
                    <span className="hestia-board-kicker">
                      {view === "landing"
                        ? "CONÇU POUR VOS IDÉES"
                        : "SYSTEM / FOUNDATION"}
                    </span>
                    <h3>
                      {view === "landing"
                        ? "Les bonnes idées méritent une belle interface."
                        : "Une base cohérente pour chaque écran."}
                    </h3>
                    <p>
                      Des couleurs qui s’accordent, un rythme lisible et des
                      composants qui parlent le même langage.
                    </p>
                  </div>
                  <button className="demo-primary" type="button">
                    Commencer →
                  </button>
                </div>
                <div className="hestia-preview-grid">
                  <article className="hestia-card">
                    <span className="hestia-board-kicker">IDENTITÉ</span>
                    <h4>Calme, lisible, mesuré.</h4>
                    <p>
                      Réservez la couleur aux actions et aux repères utiles.
                    </p>
                    <div className="hestia-color-roles">
                      {(["brand", "success", "warning", "danger"] as const).map(
                        (k) => (
                          <span
                            key={k}
                            title={k + " " + colors[k]}
                            style={{ background: colors[k] }}
                          />
                        ),
                      )}
                    </div>
                  </article>
                  <article className="hestia-card">
                    <span className="hestia-board-kicker">FORMULAIRE</span>
                    <label htmlFor="hestia-demo-email">Adresse e-mail</label>
                    <input
                      id="hestia-demo-email"
                      className="hestia-demo-input"
                      type="email"
                      placeholder="vous@exemple.fr"
                    />
                    <div className="hestia-demo-row">
                      <span>Champ requis</span>
                      <button className="demo-primary" type="button">
                        Continuer
                      </button>
                    </div>
                  </article>
                  <article className="hestia-card hestia-type-card">
                    <span className="hestia-board-kicker">HIÉRARCHIE</span>
                    <strong>Des titres qui guident</strong>
                    <h4>Une lecture naturelle.</h4>
                    <p>
                      Le corps de texte reste confortable et les informations
                      secondaires prennent leur place.
                    </p>
                    <code>font / {project.typography}</code>
                  </article>
                </div>
                <div className="hestia-component-extra">
                  <article className="hestia-card">
                    <span className="hestia-board-kicker">ACTIONS / ÉTATS</span>
                    <div className="hestia-demo-buttons">
                      <button className="demo-primary">Principal</button>
                      <button>Secondaire</button>
                      <button disabled>Indisponible</button>
                    </div>
                    <label>
                      <input type="checkbox" defaultChecked /> Recevoir les
                      mises à jour
                    </label>
                    <label>
                      <input type="checkbox" /> Mode compact
                    </label>
                  </article>
                  <article className="hestia-card">
                    <span className="hestia-board-kicker">
                      RETOUR UTILISATEUR
                    </span>
                    {(["success", "warning", "danger"] as const).map((k, i) => (
                      <p style={{ color: colors[k] }} key={k}>
                        {
                          [
                            "✓ Modifications enregistrées",
                            "⚠ Vérifiez les informations",
                            "× Une erreur est survenue",
                          ][i]
                        }
                      </p>
                    ))}
                    <progress
                      max="100"
                      value="68"
                      aria-label="Progression du projet"
                    />
                  </article>
                </div>
              </>
            )}
          </section>
          <section className="hestia-audit" aria-labelledby="audit-title">
            <div>
              <span className="hestia-eyebrow">LISIBILITÉ</span>
              <h3 id="audit-title">Contrastes du thème</h3>
              <p className="hestia-help">
                Les échecs restent visibles pour vous permettre d’ajuster les
                rôles.
              </p>
            </div>
            <div className="hestia-audit-list">
              {audit.map((item) => (
                <div key={item.name}>
                  <span>
                    <i style={{ background: item.foreground }} />
                    <i style={{ background: item.background }} />
                    {item.name}
                  </span>
                  <code>{item.ratio.toFixed(2)}:1</code>
                  <strong className={item.pass ? "is-pass" : "is-fail"}>
                    {item.pass ? "Conforme" : "À revoir"}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <p className="hestia-audit-note">
            Texte : 4,5:1. Focus : 3:1. Ces couples ne certifient pas
            l’accessibilité de la page entière. L’export indique les familles de
            polices ; auto-hébergez IBM Plex dans votre site ou choisissez
            Système.
          </p>
        </div>
      </div>
      <footer className="hestia-status" role="status">
        {notice ||
          "Vos projets restent dans vos fichiers. Enregistrez avant de quitter."}
        <span>
          {dirty ? "Modifications à enregistrer" : "Projet en mémoire"}
        </span>
      </footer>
      {confirmationDialog}
      <Modal
        open={codeOpen}
        title="Variables CSS"
        onClose={() => setCodeOpen(false)}
        className="hestia-code-modal"
      >
        <textarea
          readOnly
          aria-label="Code CSS exporté"
          value={exportCss(project)}
        />
        <button onClick={copy}>Copier le CSS</button>
      </Modal>
    </div>
  );
}
