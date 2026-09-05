import Link from "next/link";
import { ArrowUpRight, Braces, FileJson2, MoveUpRight } from "lucide-react";
import { Button } from "@atlas/ui";
import { tools } from "@/lib/tools";
export default function Home() {
  return (
    <div className="atlas-home">
      <div className="home-eyebrow">
        ATLAS WORKSPACE <span>/</span> VOTRE ATELIER NUMÉRIQUE
      </div>
      <h1>
        Les idées méritent
        <br />
        <span>de prendre forme.</span>
      </h1>
      <p className="home-intro">
        Des outils précis pour passer de l’intuition à la structure.
        <br />
        Votre espace de travail, sans détour.
      </p>
      <div className="home-section-label">
        <span>LES OUTILS</span>
        <span>01 DISPONIBLE</span>
      </div>
      {tools.map((tool) => (
        <section className="featured-tool" key={tool.id}>
          <div className="featured-copy">
            <div className="featured-category">
              <span>01 / MODÉLISATION</span>
            </div>
            <h2>
              <Braces size={22} aria-hidden="true" />
              {tool.name}
            </h2>
            <p>{tool.description}</p>
            <div className="tool-capabilities">
              <span>Tables & colonnes</span>
              <span>Relations visuelles</span>
              <span>Projets portables</span>
            </div>
            <Button asChild>
              <Link href={tool.href}>
                Ouvrir {tool.name}
                <ArrowUpRight size={16} />
              </Link>
            </Button>
            <div className="file-promise">
              <FileJson2 size={14} />
              Vos projets voyagent en fichiers. Pas en base de données.
            </div>
          </div>
          <div className="tool-diagram" aria-hidden="true">
            <span className="diagram-overline">
              STRUCTURE / CONNECTION / CLARITY
            </span>
            <div className="diagram-table first">
              <header>
                users <span>03</span>
              </header>
              <p>
                <b>PK</b> id <em>uuid</em>
              </p>
              <p>
                <i /> email <em>varchar</em>
              </p>
              <p>
                <i /> created_at <em>timestamp</em>
              </p>
            </div>
            <div className="diagram-wire">
              <span>1 : N</span>
            </div>
            <div className="diagram-table second">
              <header>
                projects <span>03</span>
              </header>
              <p>
                <b>PK</b> id <em>uuid</em>
              </p>
              <p>
                <b>FK</b> owner_id <em>uuid</em>
              </p>
              <p>
                <i /> title <em>varchar</em>
              </p>
            </div>
            <span className="diagram-corner">
              <MoveUpRight size={18} />
            </span>
          </div>
        </section>
      ))}
      <div className="home-footer">
        <span>CONCEVOIR. RELIER. CONSTRUIRE.</span>
        <p>Un outil à la fois. De nouvelles possibilités à chaque étape.</p>
      </div>
    </div>
  );
}
