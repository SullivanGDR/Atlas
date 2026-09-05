# DevToolbox

Lire ROADMAP.md, DECISIONS.md et STATUS.md avant de reprendre le travail.
La roadmap utilisateur fait autorité : ne pas changer la stack sans contrainte documentée.

- Monorepo pnpm / Turborepo, application Next.js App Router dans apps/web.
- Un outil par apps/web/features/<id>. Aucun import des internals d’un autre outil.
- packages/shared contient uniquement les contrats transverses ; packages/ui les composants génériques.
- Les packages partagés ne connaissent aucun outil. Le registre apps/web/lib/tools.ts alimente la navigation.
- Tokens de couleur dans packages/config/theme.css ; interface française, neutre, compacte et accessible.
- Aucun secret dans Git. Services gratuits uniquement ; aucun abonnement payant automatique.
- Mettre à jour STATUS.md et la checklist ROADMAP.md selon les résultats réellement vérifiés.
- Exécuter pnpm check avant de livrer. Documenter les vérifications externes restant à faire.
