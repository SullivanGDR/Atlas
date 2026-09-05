import type { Metadata } from "next";
import { Database } from "lucide-react";
import { Button, Card, Dialog } from "@devtoolbox/ui";
export const metadata: Metadata = { title: "DB Designer" };
export default function DesignerPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Database size={24} />
        <h1 className="text-2xl font-semibold">DB Designer</h1>
        <span className="ml-auto font-mono text-xs text-muted">À venir</span>
      </div>
      <p className="text-base leading-7 text-muted">
        Du modèle conceptuel à un backend prêt à intégrer dans votre projet.
      </p>
      <Card>
        <h2 className="text-lg font-semibold">Le parcours prévu</h2>
        <ol className="mt-5 divide-y divide-border">
          {[
            "Concevoir les entités et leurs attributs sur un canvas.",
            "Relier les tables et choisir les cardinalités.",
            "Transformer le MCD en MLD avec les clés étrangères.",
            "Exporter le diagramme ou un projet FastAPI + PostgreSQL.",
          ].map((text, index) => (
            <li key={text} className="flex gap-4 py-4 text-sm">
              <span className="font-mono text-muted">0{index + 1}</span>
              {text}
            </li>
          ))}
        </ol>
      </Card>
      <Dialog
        trigger={<Button variant="outline">État du développement</Button>}
        title="Le socle est en place"
        description="L’éditeur visuel n’est pas encore disponible. La prochaine étape est la gestion des comptes et des projets, puis la construction du canvas de conception."
      />
    </div>
  );
}
