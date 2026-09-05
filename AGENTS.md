# Atlas

Lire ROADMAP.md, DECISIONS.md et STATUS.md avant de reprendre le travail.
Le nom définitif est Atlas. Les instructions utilisateur récentes font autorité.

## Workflow demandé par l’utilisateur

- Développer et tester en local sur `development`. Pousser uniquement sur `development` pendant le travail courant.
- `preprod` sert à voir le rendu sur Vercel après une promotion volontaire de `development`.
- `main` reste la production : y promouvoir `preprod` à la fin d’une grosse fonctionnalité validée.
- Ne jamais inclure implicitement une promotion préproduction/production dans une simple tâche de développement.
- Ne pas lancer de déploiement Vercel ni pousser sur `main` pour montrer une modification ordinaire.
- La configuration Vercel désactive les déploiements automatiques de `development` et des branches hors `preprod`/`main`.

## Architecture et validation

- Monorepo pnpm/Turborepo, application Next.js App Router dans apps/web.
- Un outil par apps/web/features/<id>. Aucun import des internals d’un autre outil.
- packages/shared contient les contrats transverses ; packages/ui les composants génériques, indépendants de la marque.
- Le registre apps/web/lib/tools.ts alimente la navigation.
- Tokens de couleur dans packages/config/theme.css ; interface française, neutre, compacte et accessible.
- Aucun secret dans Git. Services gratuits uniquement ; aucun abonnement payant automatique.
- Mettre à jour STATUS.md et ROADMAP.md selon les résultats réellement vérifiés.
- Exécuter pnpm check avant livraison. Ne jamais promettre l’absence absolue de bugs ; préciser les contrôles réellement passés.

## Mise à jour utilisateur — Schematic

- Aucun stockage des projets en base de données et aucun compte requis. Le projet est en mémoire navigateur ; import/export de fichiers .atlas.json versionnés.
- La nouvelle instruction remplace Prisma/Neon/Auth.js et la sauvegarde distante de la roadmap initiale.
- Vérifications proportionnées : types, lint et tests métier utiles ; ne pas consulter systématiquement GitHub/CI après les pushes.
