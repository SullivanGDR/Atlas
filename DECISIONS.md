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

## Athena — première tranche fonctionnelle

- Nom public Athena, selon le thème mythologique grec choisi pour les applications Atlas. L’icône `{}` représente son rôle de conception de données. Le module interne features/db-designer est conservé ; route /tools/athena, anciennes routes redirigées.
- À la demande utilisateur, abandon des comptes et du stockage de projets en base. Aucune installation Prisma/Neon/Auth.js. État Zustand en mémoire, export/import JSON version 1, validation Zod, limite 5 Mo / 200 tables / 100 colonnes par table.
- Connexions de clé primaire vers colonne, type référencé propagé (SERIAL → INTEGER). Cardinalités 1:1, 1:N, N:N stockées dans le graphe ; transformation MCD/MLD et génération de tables de jointure restent une étape future.
- Aucun enregistrement automatique : exporter les modifications pour les retrouver après fermeture. Avertissement de fermeture et confirmation avant remplacement d’un projet modifié.
- Pas de consultation GitHub systématique ; validation locale ciblée pour cette tranche.

## 2026-09-05 — Shell compact et canvas prioritaire

- La navigation principale passe de la barre latérale à un bandeau horizontal de 54 px. Le canvas dispose ainsi de toute la largeur sur les écrans de portable.
- La liste des tables d’Athena devient un panneau superposé fermé par défaut. Son ouverture ne redimensionne plus le diagramme et elle se ferme après sélection d’une table, par clic sur le fond ou avec Échap.
- Les commandes de l’éditeur réduisent progressivement leurs libellés et se répartissent sur deux lignes sous 760 px pour conserver des cibles tactiles lisibles.

## 2026-09-05 — Athena : conception et génération

- Noms mythologiques grecs pour les outils ; icône liée au rôle avant le nom. Athena conserve les accolades. Palette désormais strictement grise, sans pastilles d’activité décoratives.
- Connexions React Flow en mode Loose : tous les points restent présents, le sens PK/FK est normalisé dans le store. Recalcul des poignées à chaque changement de clé/colonne ; connexion par deux clics, glissement, reconnexion ou formulaire.
- Format atlas-athena version 2 ; format atlas-schematic version 1 toujours accepté. Ajout de contraintes de colonnes, ON DELETE et correspondances composites. Aucun stockage serveur.
- MCD/MLD calculés sans modifier le modèle édité. Les associations N:N produisent des tables de jointure et les références composites génèrent toutes les colonnes requises.
- Générateurs déterministes TypeScript. ZIP serveur via fflate, aperçu local des sources et export SQL. Deux phases de migration (tables, puis contraintes) pour traiter aussi les cycles.
- Partage par fragment d’URL compressé limité en taille ; aucun service de partage ou compte. Historique et versions en mémoire ; chaque version peut être exportée.
- Import SQL via pgsql-ast-parser ; syntaxe non représentable refusée explicitement. L’alternative SQL de la roadmap est retenue ; pas d’import Prisma.
- Export PNG/SVG via html-to-image, cadré sur l’ensemble des nœuds. Aucune dépendance à un service d’images.
- PostgreSQL temporaire utilisé uniquement pour vérifier le backend généré. Ce n’est pas une base du site Atlas. Docker Desktop étant indisponible sur la machine, les tests PostgreSQL ont utilisé les binaires officiels portables dans test-results.
