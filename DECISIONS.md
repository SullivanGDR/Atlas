# Décisions techniques

## 2026-09-05 — Initialisation

- Next.js 16.3.4 et React 19.2.8 : versions stables disponibles lors de l’initialisation, compatibles avec le choix Next.js 14+ de la roadmap. Le détail « Next.js 14 » de la checklist est interprété comme la version minimale, pas un verrou sur une ancienne majeure.
- Tailwind CSS 4 avec PostCSS et tokens CSS partagés. pnpm 10.34.5 verrouillé dans packageManager ; Node 22 en CI et sur Vercel.
- Les composants suivent les primitives shadcn/ui (Radix, CVA, cn) avec une DA personnalisée. Les polices système évitent une dépendance réseau au build initial.
- Prisma, Neon et Auth.js sont conservés pour la phase 1. Aucun compte factice, stockage local de projets ou authentification simulée dans la phase 0.
- Vercel reste la cible de déploiement demandée. Aucun remplacement par Sites/Cloudflare.
- Le shell et le registre d’outils sont amorcés avec le socle, car ils permettent de vérifier les composants partagés. DB Designer reste explicitement marqué « À venir ».

## 2026-09-05 — Identité Atlas et développement local

- Nom définitif Atlas, à la demande de l’utilisateur : interface, métadonnées, documentation et packages @atlas/*.
- Le dépôt GitHub et le projet Vercel portaient déjà le nom Atlas.
- Travail courant et pushes uniquement sur development. preprod est préparée localement depuis main ; elle sera publiée lors de la première promotion explicite.
- Seules preprod et main autorisent les déploiements Git Vercel. Aucun déploiement de la nouvelle identité n’est demandé dans cette intervention.
- L’identité visuelle appartient à apps/web, pas au design system générique packages/ui.

- Direction visuelle précisée par l’utilisateur : sobre, moderne, légère touche futuriste ; aucun rapport au système solaire. Les premières propositions orbitales sont abandonnées et ne sont pas intégrées au dépôt.
