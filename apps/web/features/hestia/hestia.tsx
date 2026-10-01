"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  Download,
  FileJson2,
  Moon,
  Palette,
  Redo2,
  Ruler,
  Sun,
  Type,
  Undo2,
} from "lucide-react";
import { useHestia } from "./store";
import {
  contrastAudit,
  exportCss,
  palettes,
  parseProject,
  serializeProject,
  tokens,
  typography,
  type Scale,
  type Shadow,
} from "./model";
import "./hestia.css";

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

function safeName(value: string) {
  return (
    value
      .trim()
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .slice(0, 80) || "hestia"
  );
}

export function Hestia() {
  const { project, dirty, past, future, edit, replace, saved, undo, redo } =
    useHestia();
  const [notice, setNotice] = useState("");
  const [section, setSection] = useState<"palette" | "type" | "layout">(
    "palette",
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const colors = tokens(project);
  const audit = contrastAudit(project);
  const font =
    typography.find((item) => item.id === project.typography) ?? typography[0]!;

  const update = (patch: Partial<typeof project>) =>
    edit({ ...project, ...patch });
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        download(
          serializeProject(project),
          `${safeName(project.name)}.atlas.json`,
          "application/json",
        );
        saved();
        notify("Projet Hestia enregistré dans vos fichiers.");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, redo, saved, undo]);

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const next = parseProject(JSON.parse(await file.text()));
      replace(next);
      notify("Projet Hestia importé.");
    } catch {
      notify("Import impossible : fichier Hestia invalide.");
    }
  }

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(exportCss(project));
      notify("Les tokens CSS ont été copiés.");
    } catch {
      notify("Copie impossible dans ce navigateur.");
    }
  }

  const shadow =
    project.shadow === "none"
      ? "none"
      : project.shadow === "soft"
        ? "0 8px 24px #17231b18"
        : "0 16px 42px #17231b26";
  return (
    <div
      className="hestia-workspace"
      style={
        {
          "--h-background": colors.background,
          "--h-surface": colors.surface,
          "--h-foreground": colors.foreground,
          "--h-muted": colors.muted,
          "--h-border": colors.border,
          "--h-brand": colors.brand,
          "--h-brand-foreground": colors.brandForeground,
          "--h-font": font.sans,
          "--hestia-radius": `${project.radius}px`,
          "--hestia-shadow": shadow,
        } as React.CSSProperties
      }
    >
      <header className="hestia-header">
        <div className="hestia-brand">
          <Palette size={19} />
          <h1>Hestia</h1>
          <span>Design system</span>
        </div>
        <input
          aria-label="Nom du design system"
          value={project.name}
          onChange={(event) => update({ name: event.target.value })}
        />
        <div className="hestia-actions">
          <button
            aria-label="Annuler"
            title="Annuler"
            onClick={undo}
            disabled={!past.length}
          >
            <Undo2 size={15} />
          </button>
          <button
            aria-label="Rétablir"
            title="Rétablir"
            onClick={redo}
            disabled={!future.length}
          >
            <Redo2 size={15} />
          </button>
          <button
            onClick={() =>
              download(
                exportCss(project),
                `${safeName(project.name)}.css`,
                "text/css",
              )
            }
          >
            <Download size={15} /> CSS
          </button>
          <button onClick={copyCss}>
            <Clipboard size={15} /> Copier
          </button>
          <button onClick={() => fileInput.current?.click()}>
            <FileJson2 size={15} /> Projet
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => importFile(event.target.files?.[0])}
          />
        </div>
      </header>

      <div className="hestia-body">
        <aside className="hestia-library" aria-label="Bibliothèque Hestia">
          <div className="hestia-library-title">
            <span>Bibliothèque</span>
            <small>FOUNDATIONS</small>
          </div>
          <nav className="hestia-sections" aria-label="Fondations">
            <button
              className={section === "palette" ? "is-selected" : ""}
              onClick={() => setSection("palette")}
            >
              <Palette size={16} /> Couleurs
            </button>
            <button
              className={section === "type" ? "is-selected" : ""}
              onClick={() => setSection("type")}
            >
              <Type size={16} /> Typographie
            </button>
            <button
              className={section === "layout" ? "is-selected" : ""}
              onClick={() => setSection("layout")}
            >
              <Ruler size={16} /> Géométrie
            </button>
          </nav>

          {section === "palette" && (
            <div className="hestia-library-content">
              <p className="hestia-label">Bibliothèques de palettes</p>
              <p className="hestia-help">
                Des rôles sémantiques cohérents, avec un accent vérifié sur le
                contraste.
              </p>
              <div className="hestia-palette-list">
                {palettes.map((item) => (
                  <button
                    key={item.id}
                    className={
                      project.palette === item.id
                        ? "hestia-palette is-selected"
                        : "hestia-palette"
                    }
                    onClick={() =>
                      update({ palette: item.id, customAccent: item.accent })
                    }
                  >
                    <span className="hestia-swatch-row">
                      {item.swatches.map((color) => (
                        <i key={color} style={{ background: color }} />
                      ))}
                      <i
                        className="hestia-accent-swatch"
                        style={{ background: item.accent }}
                      />
                    </span>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>
              <label className="hestia-field">
                <span>Couleur de marque</span>
                <div className="hestia-color-input">
                  <input
                    type="color"
                    value={project.customAccent}
                    onChange={(event) =>
                      update({ customAccent: event.target.value })
                    }
                  />
                  <code>{project.customAccent.toUpperCase()}</code>
                </div>
              </label>
            </div>
          )}

          {section === "type" && (
            <div className="hestia-library-content">
              <p className="hestia-label">Bibliothèque typographique</p>
              <p className="hestia-help">
                Une échelle simple et une fonte adaptée au contenu avant la
                décoration.
              </p>
              <div className="hestia-type-list">
                {typography.map((item) => (
                  <button
                    key={item.id}
                    className={
                      project.typography === item.id
                        ? "hestia-type is-selected"
                        : "hestia-type"
                    }
                    onClick={() => update({ typography: item.id })}
                    style={{ fontFamily: item.sans }}
                  >
                    <span className="hestia-type-sample">Aa</span>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>
              <label className="hestia-field">
                <span>Échelle</span>
                <select
                  value={project.scale}
                  onChange={(event) =>
                    update({ scale: event.target.value as Scale })
                  }
                >
                  <option value="compact">Compacte</option>
                  <option value="standard">Standard</option>
                  <option value="airy">Aérée</option>
                </select>
              </label>
            </div>
          )}

          {section === "layout" && (
            <div className="hestia-library-content">
              <p className="hestia-label">Géométrie et profondeur</p>
              <p className="hestia-help">
                Les mêmes valeurs doivent servir aux cartes, champs, boutons et
                panneaux.
              </p>
              <label className="hestia-field">
                <span>
                  Arrondi <output>{project.radius}px</output>
                </span>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={project.radius}
                  onChange={(event) =>
                    update({ radius: Number(event.target.value) })
                  }
                />
              </label>
              <label className="hestia-field">
                <span>Ombres</span>
                <select
                  value={project.shadow}
                  onChange={(event) =>
                    update({ shadow: event.target.value as Shadow })
                  }
                >
                  <option value="none">Aucune</option>
                  <option value="soft">Discrète</option>
                  <option value="elevated">Élevée</option>
                </select>
              </label>
              <div className="hestia-radius-preview">
                <span style={{ borderRadius: project.radius }} />
                <span style={{ borderRadius: project.radius }} />
                <span style={{ borderRadius: project.radius }} />
              </div>
            </div>
          )}
          <div className="hestia-library-foot">
            <span>Atlas / Hestia</span>
            <span>
              {dirty ? "Modifications à enregistrer" : "Projet en mémoire"}
            </span>
          </div>
        </aside>

        <main className="hestia-main">
          <div className="hestia-mainbar">
            <div>
              <span className="hestia-eyebrow">PLANCHE DE STYLE</span>
              <h2>{project.name}</h2>
            </div>
            <div className="hestia-mode">
              <button
                className={project.mode === "light" ? "is-selected" : ""}
                onClick={() => update({ mode: "light" })}
              >
                <Sun size={15} /> Clair
              </button>
              <button
                className={project.mode === "dark" ? "is-selected" : ""}
                onClick={() => update({ mode: "dark" })}
              >
                <Moon size={15} /> Sombre
              </button>
            </div>
          </div>
          <section
            className="hestia-board"
            style={{
              background: colors.background,
              color: colors.foreground,
              fontFamily: font.sans,
            }}
            aria-label="Aperçu des composants"
          >
            <div className="hestia-board-head">
              <div>
                <span className="hestia-board-kicker">SYSTEM / FOUNDATION</span>
                <h3>Une base cohérente pour chaque écran.</h3>
                <p>
                  Les composants reprennent les mêmes tokens de couleur,
                  typographie, espace et profondeur.
                </p>
              </div>
              <button
                style={{
                  background: colors.brand,
                  color: colors.brandForeground,
                }}
              >
                Action principale <span>→</span>
              </button>
            </div>
            <div className="hestia-preview-grid">
              <article className="hestia-card">
                <span className="hestia-board-kicker">
                  COULEURS SÉMANTIQUES
                </span>
                <h4>Calme, lisible, mesuré.</h4>
                <p>
                  La couleur de marque reste réservée aux actions et aux repères
                  utiles.
                </p>
                <div className="hestia-color-roles">
                  <span style={{ background: colors.brand }} />
                  <span style={{ background: colors.success }} />
                  <span style={{ background: colors.warning }} />
                  <span style={{ background: colors.danger }} />
                </div>
              </article>
              <article className="hestia-card">
                <span className="hestia-board-kicker">FORMULAIRE</span>
                <label className="hestia-demo-label">Adresse e-mail</label>
                <input
                  className="hestia-demo-input"
                  placeholder="vous@exemple.fr"
                />
                <div className="hestia-demo-row">
                  <span>Champ requis</span>
                  <button
                    style={{
                      background: colors.brand,
                      color: colors.brandForeground,
                    }}
                  >
                    Continuer
                  </button>
                </div>
              </article>
              <article className="hestia-card hestia-type-card">
                <span className="hestia-board-kicker">HIÉRARCHIE</span>
                <strong>Heading principal</strong>
                <h4>Un titre qui guide la lecture</h4>
                <p>
                  Le corps de texte reste confortable, avec une largeur et un
                  contraste contrôlés.
                </p>
                <code>--hestia-brand</code>
              </article>
            </div>
          </section>
          <section className="hestia-audit" aria-labelledby="audit-title">
            <div>
              <span className="hestia-eyebrow">CONTRASTE</span>
              <h3 id="audit-title">Contrôles de lisibilité</h3>
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
                    {item.pass ? (
                      <>
                        <Check size={13} /> AA
                      </>
                    ) : (
                      "À revoir"
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      {notice && (
        <p className="hestia-notice" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
