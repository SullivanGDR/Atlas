# Décisions techniques

## 2026-09-30 — Métis, atelier de prompts

- Nom mythologique associé à l’intelligence et au conseil ; icône de message. Module isolé `features/metis` sans dépendance aux autres outils.
- Assemblage déterministe des consignes rédigées par l’utilisateur. Les modèles sont des guides et exemples, jamais des contenus imposés. Mode compact sans résumé automatique ni perte de consignes.
- Réutilisation par blocs sauvegardés dans le projet `atlas-metis` version 1. Aucun compte, API de modèle, base de données ou bibliothèque persistante implicite.
- Relecture heuristique présentée comme une aide, sans score de qualité ni garantie de résultat. Les extraits de référence sont délimités en Markdown ; cela n’est pas une mesure de sécurité absolue pour les assistants externes.

## 2026-09-30 — Thémis, rédaction des cahiers des charges

- Thémis, associée aux règles communes, donne son nom à l’outil. Module autonome `features/themis`, quatre trames adaptées aux projets numériques ; sources de conception consignées dans son README.
- Contenu saisi explicitement par l’utilisateur, questions et exemples distincts du livrable. Relecture locale déterministe des champs manquants et ambiguïtés, sans génération par IA ni certification de conformité.
- Format portable `atlas-themis` version 1 ; projets en mémoire, exigences à identifiants stables et historique local. Aucun compte ni stockage serveur.
- DOCX OOXML natif via la dépendance existante `fflate`, avec styles et tableaux éditables plutôt qu’une capture ou du HTML incorporé. Sommaire cliquable statique, options de garde et de papier.
- Google Docs passe par l’import du DOCX et une procédure visible dans l’outil. Aucun OAuth ou transfert implicite ; la conversion peut modifier la pagination. Le JSON reste le format de reprise dans Thémis.

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

## 2026-09-30 — Planche d’export image dédiée

- Remplace la capture HTML via html-to-image : SVG natif depuis le modèle, puis rasterisation de ce même document dans un canvas pour PNG. Aucun contrôle HTML, aucune police ou image distante, aucune donnée envoyée au serveur.
- Un bouton Export dans la barre principale ouvre les choix MCD / MLD / ERD et PNG / SVG. La génération backend conserve son bouton Générer.
- Mise en page automatique dédiée, indépendante des positions d’édition : grille de tables, relations orthogonales, bornes incluant les libellés, titre et signature. Palette papier permanente définie dans les tokens du thème.
- MCD : projection conceptuelle existante, sans FK ni types SQL ; MLD : transformation existante avec jointures ; ERD : représentation du schéma édité. Les cardinalités disponibles restent 1:1, 1:N et N:N ; aucune cardinalité minimale non renseignée n’est inventée.
- Le PNG est plafonné à 8192 px par côté et 24 millions de pixels pour limiter la mémoire. Le SVG conserve sa définition vectorielle pour les grands projets.

## 2026-09-30 — Finitions de la présentation Athena

- La dernière préférence utilisateur remplace le fond blanc par un gris perle doux, toujours indépendant du thème de l’éditeur. Les boutons de la barre deviennent compacts et neutres.
- La géométrie réserve les hauteurs du modèle logique pour les entités présentes dans les deux vues. Les FK restent absentes du contenu MCD, sans déplacer ni rétrécir les tables ; les jointures ajoutées apparaissent uniquement en MLD.
- Les liaisons conceptuelles disposent de points distincts par côté, triés selon la position des entités voisines. Courbes quadratiques aux angles des tracés orthogonaux.
- Chaque entrée de légende est un groupe SVG positionné séparément : aucune dépendance aux espaces multiples, que SVG fusionne par défaut.

## 2026-09-30 — Lisibilité du MCD

- Suppression de la contrainte qui réduisait tout le document à 340 px de hauteur dans l’aperçu. Ajustement à la largeur par défaut, zoom 100 % et défilement sans modifier le fichier exporté.
- Champs à 17 px, clés à 13 px et titres de tables à 20 px. Les retours à la ligne et les hauteurs partagées sont recalculés.
- En MCD, cardinalités 1/N portées aux extrémités plutôt que dans des pastilles centrales ; liaison directe entre bords haut/bas de deux entités verticalement voisines, sans traverser une entité intermédiaire.

## 2026-09-30 — Iris, cartographie du SI

- Nom retenu : Iris, messagère de la mythologie grecque, associé aux connexions entre services. Icône réseau, palette neutre Atlas, couleurs réservées aux logos officiels.
- Module autonome `features/iris`, aucune dépendance aux internals d’Athena. React Flow pour la manipulation ; zones via parentés explicites, services et flux avec métadonnées.
- Même principe de confidentialité : mémoire navigateur et fichiers locaux. Format `atlas-iris`, version 1, distinct des projets Athena, avec validation de références et détection des cycles.
- Premier périmètre inspiré des vues de paysage C4, groupes Structurizr et catalogues draw.io ; pas de prétention de conformité exhaustive C4/ArchiMate. Les sources sont consignées dans le README du module, les attributions des logos dans `public/iris/logos/README.md`.
- Aucun déploiement ni promotion de branche inclus dans cette tranche.

## 2026-09-30 — Organisation des projections et compaction MCD

- La nouvelle préférence remplace la réserve de hauteur commune aux exports MCD/MLD : chaque carte MCD utilise uniquement ses champs visibles. Les cartes sont alignées en haut des rangées.
- Organiser les tables agit sur une projection locale en MCD/MLD, sans modifier les données, positions ou historique du schéma éditable. L’organisation de l’Éditeur conserve son comportement.
- Le canvas MCD utilise une poignée par extrémité de relation, répartie sur le corps de la carte. Les poignées sont recalculées quand leurs côtés ou offsets changent ; les relations ne convergent plus toutes sur l’en-tête.

## 2026-10-01 — Métis : consignes de réalisation locales

- Métis reste un atelier déterministe sans appel à une IA. Les recommandations générales sur le contexte, les exemples, les formats de sortie et les critères de réussite sont traduites en champs et instructions explicites, sans score d’optimalité.
- Le périmètre et les exemples attendus sont des champs distincts afin de séparer les limites de modification et les résultats de référence. Les blocs de code sont clôturés avec une fence Markdown adaptée à leur contenu.
- Les consignes d’exécution sont un réglage explicite du projet : cible assistant/agent, livrable/plan, clarification/hypothèses, méthode, vérification et compte rendu. Un projet version 1 les désactive lors de la migration afin de préserver son texte exporté.
- Les contrôles demandés restent formulés comme des actions possibles et des résultats à rapporter ; aucune réussite, source, donnée ou capacité n’est inventée. Les consignes personnalisées du champ Incertitudes prévalent sur le réglage générique.

## 2026-10-01 — Hestia : fondations de design system

- Hestia est un outil local de fondations visuelles, séparé des internals des autres outils. Il ne tente pas de remplacer Figma ni d’imposer une bibliothèque de composants complète.
- Les palettes sont enregistrées par rôles sémantiques plutôt que par usages de composants. Cette séparation permet de basculer entre thèmes clair et sombre et de conserver une identité cohérente.
- Les palettes proposées sont des compositions Atlas originales ; leurs principes de tokens, couches et contraste suivent les recommandations publiques d’USWDS et Carbon, sans recopier leurs composants ou leurs marques.
- L’audit de contraste utilise le seuil AA de 4,5:1 pour le texte courant. Il signale une paire, mais ne certifie pas une page entière ni les états d’interaction non affichés.

## 2026-10-01 — Hestia : styles et export cohérents

- Les directions appliquent une combinaison explicite de palette, fonte, densité et géométrie. La marque reste confinée à l’aperçu ; l’atelier utilise le thème neutre Atlas.
- Les rôles personnalisés sont séparés en clair/sombre et conservés dans le projet version 2. Le modèle accepte la version 1 avec valeurs nouvelles par défaut ; les palettes inconnues et les couleurs non hexadécimales sont refusées.
- La même fonction de fondations alimente les paramètres d’aperçu et d’export. Gammes sRGB calculées localement ; les harmonies HSL sont des suggestions à contrôler selon leur usage.
- JSON de tokens Hestia distinct du projet, sans revendication DTCG. HTML autonome de démarrage avec composants exemples et échappement du nom ; les familles de polices sont déclarées sans téléchargement distant.
