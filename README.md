# DevToolbox

[Application en ligne](https://atlas-ten-cyan.vercel.app) · [Dépôt GitHub](https://github.com/SullivanGDR/Atlas)

Hub d’outils pour projets d’études et personnels. Le premier outil sera un concepteur de bases de données MCD/MLD avec export FastAPI + PostgreSQL.

Le dépôt commence par le socle ; l’éditeur, les comptes et la sauvegarde ne sont pas encore implémentés. Voir [ROADMAP.md](ROADMAP.md) et [STATUS.md](STATUS.md).

## Démarrer

Node.js 22 LTS et pnpm 10.34.5 sont utilisés en CI.

```sh
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Si Corepack est absent : `npm install --global pnpm@10.34.5`.
Ouvrir http://localhost:3000. Aucune variable secrète n’est nécessaire pour la phase 0.

```sh
pnpm check       # format, lint, types, tests du registre et build production
pnpm format      # formatage
pnpm build
pnpm --filter @devtoolbox/web start
```

## Structure

- `apps/web` : routes Next.js, shell et registre public des outils.
- `packages/ui` : Button, Card, Input, Dialog, ThemeToggle, Sidebar.
- `packages/shared` : contrats transverses.
- `packages/config` : TypeScript strict, ESLint et tokens Tailwind.

## Ajouter un outil

1. Créer `apps/web/features/<id>/` avec ses composants, modèle, transformations, générateurs et store selon ses besoins.
2. Ajouter sa page dans `apps/web/app/tools/<id>/page.tsx`.
3. Déclarer ses métadonnées dans `apps/web/lib/tools.ts` : la navigation suit automatiquement.
4. Garder toute logique métier dans le module ; partager uniquement les contrats via `packages/shared` et les composants génériques via `packages/ui`.
5. Ajouter les tests métier utiles, exécuter `pnpm check` et actualiser la roadmap.

## GitHub et Vercel

Le workflow `.github/workflows/ci.yml` vérifie les pull requests et les pushes vers main, sans secrets externes.

Dans Vercel, importer le dépôt GitHub dans un compte Hobby existant :

- Framework : Next.js.
- Root Directory : `apps/web`.
- Activer l’inclusion des fichiers situés hors de Root Directory (packages partagés).
- Node.js : 22.x ; conserver les commandes de build et d’installation détectées pour pnpm/Next.js.
- Branche de production : `main`.
- Aucune variable d’environnement requise au stade actuel.

Vérifier la page d’accueil, `/tools/db-designer`, la bascule de thème et le résultat du workflow après le premier push. Un build local réussi ne valide pas à lui seul le déploiement distant.

Documentation officielle : [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Turborepo sur Vercel](https://vercel.com/docs/monorepos/turborepo).

Pour la phase 1, configurer Neon, Prisma et l’application OAuth GitHub ; `apps/web/.env.example` liste les variables prévues. Ne jamais committer les secrets.
