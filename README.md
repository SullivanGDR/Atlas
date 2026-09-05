# Atlas

Hub d’outils pour projets d’études et personnels. Le premier outil sera un concepteur de bases de données MCD/MLD avec export FastAPI + PostgreSQL.

[Dépôt GitHub](https://github.com/SullivanGDR/Atlas) · [Production stable](https://atlas-ten-cyan.vercel.app)

La production peut différer de la branche de développement. Athena est disponible en première version : tables, colonnes, relations et fichiers de projet. Aucun compte ni stockage en base de données. Voir [ROADMAP.md](ROADMAP.md) et [STATUS.md](STATUS.md).

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

## Utiliser Athena

- Éditeur : créer des tables, renseigner leurs colonnes ; ouvrir les propriétés avec l’icône de réglages pour les contraintes et la suppression.
- Relation : glisser entre les points, cliquer successivement sur deux points ou utiliser le bouton Relation. Le formulaire permet aussi de créer la colonne étrangère. Une extrémité de lien peut être déplacée.
- MCD / MLD : aperçus du modèle conceptuel et du modèle logique, avec jointures N:N et références composites.
- Projet : importer JSON/SQL, enregistrer le JSON, conserver des versions de session, partager un lien ou exporter PNG/SVG.
- Générer : aperçu des sources et téléchargement du ZIP FastAPI/PostgreSQL ou du SQL. Le ZIP inclut migrations, Docker et scripts de lancement.
- Ctrl+Z annule ; Ctrl+Maj+Z ou Ctrl+Y rétablit ; Ctrl+S exporte le projet. Les projets ne sont pas sauvegardés automatiquement.

Le SQL importé doit décrire la structure avec CREATE TABLE / ALTER TABLE ADD CONSTRAINT. Types personnalisés, CHECK, tableaux, UNIQUE composites, instructions de données et schémas autres que public sont refusés explicitement. Les noms destinés à la génération doivent être en snake_case non réservé. Les défauts acceptés sont les littéraux SQL et les fonctions usuelles affichées dans les propriétés.

Les liens de partage contiennent une copie figée du schéma. Les versions sont conservées dans la session ; exportez chaque version utile pour la retrouver après fermeture. Les fichiers JSON de première version restent lisibles.

### Vérifier le backend généré

Le test métier peut exporter un blog complet si la variable ATHENA_EXPORT_FIXTURE contient un chemin de sortie. Le script apps/web/scripts/verify-fastapi.py vérifie ce projet contre une base PostgreSQL temporaire nommée athena_test sur localhost : migrations réversibles, CRUD, contraintes, défauts et clés composites. Voir STATUS.md pour les contrôles effectivement exécutés.

## Structure du dépôt

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

Les projets Athena restent en mémoire navigateur. Exportez un fichier `.atlas.json` pour conserver votre travail, puis importez-le pour le reprendre. Aucun compte, Prisma, Neon ou Auth.js ne sera nécessaire pour ce fonctionnement.

Documentation officielle : [Next.js](https://nextjs.org/docs/app/getting-started/installation), [déploiements Vercel par branche](https://vercel.com/docs/project-configuration/git-configuration).
