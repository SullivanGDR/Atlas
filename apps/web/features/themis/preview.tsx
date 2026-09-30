import { Fragment } from "react";
import {
  blocks,
  documentChapters,
  type SpecProject,
  type ExportOptions,
} from "./model";
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*[^*]+\*\*)/g)
        .map((s, i) =>
          s.startsWith("**") && s.endsWith("**") ? (
            <strong key={i}>{s.slice(2, -2)}</strong>
          ) : (
            <Fragment key={i}>{s}</Fragment>
          ),
        )}
    </>
  );
}
export function Prose({ text }: { text: string }) {
  return (
    <>
      {blocks(text).map((b, i) =>
        b.kind === "heading" ? (
          <h3 key={i}>
            <InlineText text={b.text} />
          </h3>
        ) : b.kind === "bullet" ? (
          <ul key={i}>
            <li>
              <InlineText text={b.text} />
            </li>
          </ul>
        ) : (
          <p key={i}>
            <InlineText text={b.text} />
          </p>
        ),
      )}
    </>
  );
}
export function DocumentPreview({
  project,
  options,
}: {
  project: SpecProject;
  options: ExportOptions;
}) {
  const chapters = documentChapters(project, options);
  return (
    <article className="themis-paper">
      <p className="themis-paper-kicker">Cahier des charges</p>
      <h1>{project.name}</h1>
      <p>
        Version {project.version || "Non renseignée"} ·{" "}
        {project.date || "Date non renseignée"} · {project.status} ·{" "}
        {project.confidentiality}
      </p>
      <p>
        Commanditaire : {project.client || "Non renseigné"}
        <br />
        Rédacteur : {project.author || "Non renseigné"}
      </p>
      <p>
        Ce document définit le besoin, le périmètre, les exigences et les
        conditions de validation du projet. Il sert de référence commune aux
        parties prenantes.
      </p>
      {project.status !== "Validé" && (
        <p>
          Document de travail à relire et à faire valider par les parties
          prenantes.
        </p>
      )}
      {options.contents && chapters.length > 0 && (
        <nav aria-label="Sommaire du document">
          <h2>Sommaire</h2>
          {chapters.map((c, i) => (
            <a key={c.id} href={`#spec-${c.id}`}>
              {i + 1} {c.title}
            </a>
          ))}
        </nav>
      )}
      {chapters.map((chapter, i) => (
        <section key={chapter.id} id={`spec-${chapter.id}`}>
          <h2>
            {i + 1} {chapter.title}
          </h2>
          {chapter.requirements ? (
            <>
              <p>
                La priorité « Hors version » identifie les éléments exclus de la
                livraison considérée.
              </p>
              {chapter.requirements.length > 0 ? (
                <div className="themis-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Exigence</th>
                        <th>Priorité</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapter.requirements.map((r) => (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td>{r.title || "Sans titre"}</td>
                          <td>{r.priority}</td>
                          <td>{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Aucune exigence renseignée.</p>
              )}
              {chapter.requirements.map((r) => (
                <section key={r.id}>
                  <h3>
                    {r.id} {r.title || "Sans titre"}
                  </h3>
                  <p>
                    {r.type} · {r.priority} · {r.status} · Responsable :{" "}
                    {r.owner || "Non renseigné"}
                  </p>
                  <Prose
                    text={r.description || "Description non renseignée."}
                  />
                  {r.rationale && (
                    <>
                      <h4>Justification</h4>
                      <Prose text={r.rationale} />
                    </>
                  )}
                  <h4>Critères de recette</h4>
                  <Prose text={r.acceptance || "Critères non renseignés."} />
                </section>
              ))}
            </>
          ) : (
            <Prose text={chapter.content || "Rubrique non renseignée."} />
          )}
        </section>
      ))}
      {!chapters.length && (
        <p>
          Aucune rubrique renseignée. Complétez le document avant diffusion.
        </p>
      )}
      <footer>Made on Atlas by Thémis</footer>
    </article>
  );
}
