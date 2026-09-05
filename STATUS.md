# État du projet

## 2026-09-05 — Identité Atlas et workflow local

- Nom définitif Atlas : interface, métadonnées, documentation et packages @atlas/*.
- Identité : monogramme géométrique sobre, sans référence spatiale ; voir BRAND.md.
- Branche de travail : development. preprod préparée localement depuis main.
- Travail courant et pushes sur development uniquement. Aucune promotion préproduction/production dans cette intervention.
- Vercel : déploiements Git désactivés pour development, autorisés pour preprod et main.
- CI : vérifications sur les trois branches ; contrôle du sens des PR de promotion.
- Validation locale réussie : formatage, lint sans avertissement, TypeScript strict, 2 tests Vitest et build de production.
- Les deux pages, le manifeste et les six fichiers d’icônes répondent en HTTP 200. Aperçu local ouvert sur http://localhost:3000.
- Favicon ICO corrigé en RGBA pour la compatibilité du décodeur Next.js.
- Aucun déploiement Vercel lancé pour cette modification. CI distante à vérifier après le push development.

## Socle disponible

Next.js App Router, pnpm/Turborepo, TypeScript strict, Tailwind, composants partagés, thèmes et registre des outils.

Dépôt : https://github.com/SullivanGDR/Atlas
La production https://atlas-ten-cyan.vercel.app reste sur main et peut afficher l’ancienne identité jusqu’à une prochaine promotion.

## Suite

Phase 1 : Prisma + Neon, Auth.js GitHub, modèles User/Project et tableau de bord.
Phase 2 : modèle métier et store Zustand, puis canvas React Flow.

DB Designer, la connexion, la persistance et l’export FastAPI ne sont pas encore implémentés.
