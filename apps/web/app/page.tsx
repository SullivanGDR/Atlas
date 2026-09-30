import Link from "next/link";
import {
  ArrowUpRight,
  Braces,
  FileJson2,
  Network,
  ClipboardList,
} from "lucide-react";
import { tools } from "@/lib/tools";

function AthenaPreview() {
  return (
    <div className="athena-preview" aria-hidden="true">
      <div className="preview-toolbar">
        <span>athena / schéma</span>
        <span>2 tables · 1 relation</span>
      </div>
      <svg viewBox="0 0 600 340" role="presentation" focusable="false">
        <defs>
          <pattern
            id="preview-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.8" className="preview-grid-dot" />
          </pattern>
        </defs>
        <rect width="600" height="340" className="preview-canvas" />
        <rect width="600" height="340" fill="url(#preview-grid)" />
        <path
          d="M260 126 H285 Q300 126 300 141 V221 Q300 236 315 236 H340"
          className="preview-connection"
        />
        <circle cx="260" cy="126" r="4" className="preview-port" />
        <circle cx="340" cy="236" r="4" className="preview-port" />
        <rect
          x="276"
          y="172"
          width="48"
          height="23"
          rx="4"
          className="preview-relation-label"
        />
        <text
          x="300"
          y="188"
          textAnchor="middle"
          className="preview-relation-text"
        >
          1 : N
        </text>

        <g className="preview-table">
          <rect
            x="50"
            y="70"
            width="210"
            height="162"
            rx="6"
            className="preview-table-body"
          />
          <path
            d="M56 70 H254 Q260 70 260 76 V106 H50 V76 Q50 70 56 70 Z"
            className="preview-table-head"
          />
          <path d="M50 106 H260" className="preview-divider" />
          <text x="65" y="93" className="preview-table-name">
            users
          </text>
          <text x="245" y="93" textAnchor="end" className="preview-table-count">
            03
          </text>
          <text x="65" y="131" className="preview-key">
            PK
          </text>
          <text x="94" y="131" className="preview-field">
            id
          </text>
          <text x="245" y="131" textAnchor="end" className="preview-type">
            uuid
          </text>
          <text x="94" y="171" className="preview-field">
            email
          </text>
          <text x="245" y="171" textAnchor="end" className="preview-type">
            varchar
          </text>
          <text x="94" y="211" className="preview-field">
            created_at
          </text>
          <text x="245" y="211" textAnchor="end" className="preview-type">
            timestamp
          </text>
        </g>

        <g className="preview-table">
          <rect
            x="340"
            y="140"
            width="215"
            height="162"
            rx="6"
            className="preview-table-body"
          />
          <path
            d="M346 140 H549 Q555 140 555 146 V176 H340 V146 Q340 140 346 140 Z"
            className="preview-table-head"
          />
          <path d="M340 176 H555" className="preview-divider" />
          <text x="355" y="163" className="preview-table-name">
            projects
          </text>
          <text
            x="540"
            y="163"
            textAnchor="end"
            className="preview-table-count"
          >
            03
          </text>
          <text x="355" y="201" className="preview-key">
            PK
          </text>
          <text x="384" y="201" className="preview-field">
            id
          </text>
          <text x="540" y="201" textAnchor="end" className="preview-type">
            uuid
          </text>
          <text x="355" y="241" className="preview-key">
            FK
          </text>
          <text x="384" y="241" className="preview-field">
            owner_id
          </text>
          <text x="540" y="241" textAnchor="end" className="preview-type">
            uuid
          </text>
          <text x="384" y="281" className="preview-field">
            title
          </text>
          <text x="540" y="281" textAnchor="end" className="preview-type">
            varchar
          </text>
        </g>
      </svg>
      <div className="preview-status">
        <span>MODÈLE RELATIONNEL</span>
        <span>01 / 01</span>
      </div>
    </div>
  );
}

function IrisPreview() {
  return (
    <div className="athena-preview" aria-hidden="true">
      <div className="preview-toolbar">
        <span>iris / architecture</span>
        <span>Services · Zones · Flux</span>
      </div>
      <svg viewBox="0 0 600 340" role="presentation" focusable="false">
        <rect
          x="30"
          y="45"
          width="340"
          height="250"
          rx="8"
          className="preview-table"
          strokeDasharray="5 5"
        />
        <text x="50" y="73" className="preview-type">
          PLATEFORME APPLICATIVE
        </text>
        <path
          d="M190 152 H255 V232 H435 V162"
          className="preview-divider"
          fill="none"
        />
        <path d="M255 152 H430" className="preview-divider" fill="none" />
        {[
          { x: 55, y: 110, name: "Portail web", detail: "Application" },
          { x: 220, y: 190, name: "API métier", detail: "HTTPS / REST" },
          { x: 410, y: 110, name: "PostgreSQL", detail: "Données privées" },
        ].map((n) => (
          <g key={n.name}>
            <rect
              x={n.x}
              y={n.y}
              width="145"
              height="80"
              rx="7"
              className="preview-table"
            />
            <text x={n.x + 14} y={n.y + 32} className="preview-table-name">
              {n.name}
            </text>
            <text x={n.x + 14} y={n.y + 56} className="preview-type">
              {n.detail}
            </text>
          </g>
        ))}
      </svg>
      <div className="preview-status">
        <span>CARTOGRAPHIE DU SI</span>
        <span>VUE D’ENSEMBLE</span>
      </div>
    </div>
  );
}
function ThemisPreview() {
  return (
    <div className="athena-preview" aria-hidden="true">
      <div className="preview-toolbar">
        <span>thémis / cahier des charges</span>
        <span>Besoin · Exigences · Recette</span>
      </div>
      <svg viewBox="0 0 600 340" role="presentation" focusable="false">
        <rect
          x="110"
          y="25"
          width="380"
          height="290"
          rx="5"
          className="preview-table"
        />
        <text x="140" y="61" className="preview-type">
          CAHIER DES CHARGES
        </text>
        <text x="140" y="96" className="preview-table-name">
          Un cadre clair pour construire.
        </text>
        <path d="M140 118H458" className="preview-divider" />
        <text x="140" y="149" className="preview-field">
          01 Contexte et objectifs
        </text>
        <text x="140" y="183" className="preview-field">
          02 Périmètre et exigences
        </text>
        <rect
          x="140"
          y="205"
          width="318"
          height="64"
          rx="4"
          className="preview-table-head"
        />
        <text x="153" y="229" className="preview-type">
          REQ-001 · INDISPENSABLE
        </text>
        <text x="153" y="251" className="preview-field">
          Un résultat précis et vérifiable.
        </text>
        <text x="458" y="293" textAnchor="end" className="preview-type">
          Version 0.1 · En relecture
        </text>
      </svg>
      <div className="preview-status">
        <span>RÉDACTION GUIDÉE</span>
        <span>WORD / GOOGLE DOCS</span>
      </div>
    </div>
  );
}
const toolPresentation = {
  themis: {
    category: "CAHIER DES CHARGES",
    Icon: ClipboardList,
    details: [
      "Trames guidées, exigences et critères de recette",
      "Relecture et export Word compatible Google Docs",
    ],
    Preview: ThemisPreview,
  },
  iris: {
    category: "CARTOGRAPHIE DU SI",
    Icon: Network,
    details: [
      "Services, logos et zones imbriquées",
      "Flux documentés et exports PNG / SVG",
    ],
    Preview: IrisPreview,
  },
  athena: {
    category: "CONCEPTION DE DONNÉES",
    Icon: Braces,
    details: [
      "Modélisation visuelle MCD / MLD",
      "Export SQL, image et projet FastAPI",
    ],
    Preview: AthenaPreview,
  },
};
export default function Home() {
  return (
    <div className="atlas-home">
      <section className="home-hero" aria-labelledby="home-title">
        <div>
          <p className="home-kicker">Atlas / espace de conception</p>
          <h1 id="home-title">
            Des outils concrets
            <br />
            pour vos projets.
          </h1>
        </div>
        <p className="home-intro">
          Cadrez vos besoins avec Thémis, concevez vos données avec Athena et
          cartographiez votre SI avec Iris.
        </p>
      </section>

      <div className="home-section-label">
        <h2>Les outils</h2>
        <span>{String(tools.length).padStart(2, "0")} / DISPONIBLES</span>
      </div>
      {tools.map((tool) => {
        const { category, Icon, details, Preview } = toolPresentation[tool.id];
        return (
          <section
            className="featured-tool"
            key={tool.id}
            aria-labelledby={`${tool.id}-title`}
          >
            <div className="featured-copy">
              <p className="featured-category">{category}</p>
              <h3 id={`${tool.id}-title`}>
                <Icon size={28} strokeWidth={1.7} aria-hidden="true" />
                {tool.name}
              </h3>
              <p className="featured-description">{tool.description}</p>
              <ul className="featured-details">
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
              <Link className="featured-link" href={tool.href}>
                Ouvrir {tool.name}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <p className="file-promise">
                <FileJson2 size={15} aria-hidden="true" />
                Projets enregistrés dans vos fichiers .atlas.json
              </p>
            </div>
            <Preview />
          </section>
        );
      })}
      <p className="home-note">
        Atlas s’enrichira d’autres outils au fil du temps.
      </p>
    </div>
  );
}
