import Link from "next/link";
import { ArrowUpRight, Braces, FileJson2 } from "lucide-react";
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
          Atlas réunit des outils de conception. Commencez par dessiner votre
          schéma de données avec Athena.
        </p>
      </section>

      <div className="home-section-label">
        <h2>Les outils</h2>
        <span>01 / DISPONIBLE</span>
      </div>
      {tools.map((tool) => (
        <section
          className="featured-tool"
          key={tool.id}
          aria-labelledby={`${tool.id}-title`}
        >
          <div className="featured-copy">
            <p className="featured-category">01 — CONCEPTION DE DONNÉES</p>
            <h3 id={`${tool.id}-title`}>
              <Braces size={28} strokeWidth={1.7} aria-hidden="true" />
              {tool.name}
            </h3>
            <p className="featured-description">
              Dessinez vos tables, reliez leurs clés et passez du schéma à un
              backend FastAPI prêt à adapter.
            </p>
            <ul className="featured-details">
              <li>Modélisation visuelle MCD / MLD</li>
              <li>Export SQL, image et projet FastAPI</li>
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
          <AthenaPreview />
        </section>
      ))}
      <p className="home-note">
        Atlas s’enrichira d’autres outils au fil du temps.
      </p>
    </div>
  );
}
