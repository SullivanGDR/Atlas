import Link from "next/link";
import { ArrowUpRight, Database } from "lucide-react";
import { Button, Card } from "@devtoolbox/ui";
import { tools } from "@/lib/tools";
export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
          Bibliothèque / 01
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Vos outils, au même endroit.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted">
          Un espace pour concevoir, générer et avancer sur vos projets.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.id} className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <Database size={24} strokeWidth={1.5} />
              <span className="rounded border border-border px-2 py-1 font-mono text-xs text-muted">
                À venir
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{tool.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {tool.description}
              </p>
            </div>
            <div className="mt-auto border-t border-border pt-4">
              <Button asChild variant="outline">
                <Link href={tool.href}>
                  Voir le périmètre <ArrowUpRight size={16} />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <p className="border-t border-border pt-5 text-sm text-muted">
        La première version de DB Designer est en préparation. Les comptes et la
        sauvegarde de projets seront ajoutés ensuite.
      </p>
    </div>
  );
}
