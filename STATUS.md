# État du projet

## 2026-09-05 — Phase 0 terminée

- Monorepo pnpm/Turborepo, Next.js App Router et TypeScript strict.
- Tailwind et tokens clair/sombre partagés ; six composants UI de base.
- Shell et registre extensible ; accueil et page de périmètre DB Designer.
- Roadmap conservée, décisions et consignes de reprise documentées.
- Dépôt GitHub public : https://github.com/SullivanGDR/Atlas (créé par l’utilisateur, nom de l’application : DevToolbox).
- Production Vercel Hobby : https://atlas-ten-cyan.vercel.app
- Dashboard Vercel : https://vercel.com/sullivangdrs-projects/atlas
- Import GitHub connecté à main, preset Next.js, racine apps/web ; aucune variable secrète déployée.

## Vérifications

- Formatage, lint sans avertissement, TypeScript strict, 2 tests Vitest et build de production réussis localement.
- CI distante du commit initial ca044fd verte : https://github.com/SullivanGDR/Atlas/actions/runs/33952596842
- Premier déploiement Vercel réussi ; réponses HTTP 200 et contenu DevToolbox vérifiés sur / et /tools/db-designer en production.
- Aucun test navigateur interactif exécuté dans cette session.

## Suite

Phase 1 : Prisma + Neon, Auth.js avec GitHub, modèles User/Project et tableau de bord. Le shell est déjà amorcé.
Phase 2 : modèle métier et store Zustand, puis canvas React Flow.

DB Designer, la connexion, la persistance et l’export FastAPI ne sont pas encore implémentés. Ne pas présenter ces fonctionnalités comme disponibles.
