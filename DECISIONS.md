# Décisions techniques

## 2026-09-05 — Initialisation

- Next.js 16.3.4 et React 19.2.8 : versions stables disponibles lors de l’initialisation, compatibles avec le choix Next.js 14+ de la roadmap. Le détail « Next.js 14 » de la checklist est interprété comme la version minimale, pas un verrou sur une ancienne majeure.
- Tailwind CSS 4 avec PostCSS et tokens CSS partagés. pnpm 10.34.5 verrouillé dans packageManager ; Node 22 en CI et sur Vercel.
- Les composants suivent les primitives shadcn/ui (Radix, CVA, cn) avec une DA personnalisée. Les polices système évitent une dépendance réseau au build initial.
- Prisma, Neon et Auth.js sont conservés pour la phase 1. Aucun compte factice, stockage local de projets ou authentification simulée dans la phase 0.
- Vercel reste la cible de déploiement demandée. Aucun remplacement par Sites/Cloudflare.
- Le shell et le registre d’outils sont amorcés avec le socle, car ils permettent de vérifier les composants partagés. DB Designer reste explicitement marqué « À venir ».
