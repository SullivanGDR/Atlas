# Atlas

Hub d’outils pour projets d’études et personnels. Le premier outil sera un concepteur de bases de données MCD/MLD avec export FastAPI + PostgreSQL.

[Dépôt GitHub](https://github.com/SullivanGDR/Atlas) · [Production stable](https://atlas-ten-cyan.vercel.app)

La production peut différer de la branche de développement. L’éditeur, les comptes et la sauvegarde ne sont pas encore implémentés. Voir [ROADMAP.md](ROADMAP.md) et [STATUS.md](STATUS.md).

## Développement local

Node.js 22 LTS et pnpm 10.34.5 sont utilisés en CI.

```sh
git switch development
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Si Corepack est absent : `npm install --global pnpm@10.34.5`.
Ouvrir http://localhost:3000. Aucune variable secrète n’est nécessaire pour le socle actuel.

```sh
pnpm check
pnpm format
pnpm build
pnpm --filter @atlas/web start
```

## Branches et mises en ligne

| Branche       | Usage                                           | Vercel                        |
| ------------- | ----------------------------------------------- | ----------------------------- |
| `development` | Développement local, commits et pushes courants | Aucun déploiement automatique |
| `preprod`     | Validation visuelle d’un lot prêt               | Preview                       |
| `main`        | Grosses fonctionnalités terminées et validées   | Production                    |

Pendant le développement : `git push origin development`.
Quand une prévisualisation est demandée, promouvoir `development` vers `preprod` par une PR (merge classique, sans squash pour garder l’ascendance des branches longues). Après validation du rendu et en fin de grosse fonctionnalité, promouvoir `preprod` vers `main`.

Lors de la première promotion, publier la branche locale `preprod` si elle n’existe pas encore sur GitHub. Cette action déclenchera la première préproduction ; elle n’est pas effectuée dans les tâches de développement ordinaires.

La CI vérifie les trois branches et les PR. Le job `promotion` vérifie le sens des PR. Il ne remplace pas les protections de branches GitHub et n’empêche pas à lui seul un push direct ; aucune protection distante n’est revendiquée ici.

`apps/web/vercel.json` désactive les déploiements automatiques de toutes les branches sauf `preprod` et `main`. Cette politique accompagne les commits de développement. Les déploiements manuels Vercel restent des actions explicites.

## Structure

- `apps/web` : routes Next.js, shell, identité Atlas et registre public des outils.
- `packages/ui` : Button, Card, Input, Dialog, ThemeToggle, Sidebar.
- `packages/shared` : contrats transverses.
- `packages/config` : TypeScript strict, ESLint et tokens Tailwind.
- `apps/web/public/brand` : symbole et icônes Atlas. Voir [BRAND.md](BRAND.md).

## Ajouter un outil

1. Créer `apps/web/features/<id>/` avec ses composants, modèle, transformations, générateurs et store selon ses besoins.
2. Ajouter sa page dans `apps/web/app/tools/<id>/page.tsx`.
3. Déclarer ses métadonnées dans `apps/web/lib/tools.ts` : la navigation suit automatiquement.
4. Garder la logique métier dans le module ; partager les contrats via `packages/shared` et les composants génériques via `packages/ui`.
5. Ajouter les tests métier utiles, exécuter `pnpm check` et actualiser la roadmap.

## Vercel et services futurs

Le projet Vercel existant reste lié à ce dépôt : preset Next.js, racine `apps/web`, packages partagés inclus, branche de production `main`, plan Hobby. Aucun déploiement n’est nécessaire pour développer localement.

Pour la phase 1, configurer Neon, Prisma et l’application OAuth GitHub ; `apps/web/.env.example` liste les variables prévues. Séparer les données et secrets de préproduction de ceux de production. Ne jamais committer les secrets.

Documentation officielle : [Next.js](https://nextjs.org/docs/app/getting-started/installation), [déploiements Vercel par branche](https://vercel.com/docs/project-configuration/git-configuration).
