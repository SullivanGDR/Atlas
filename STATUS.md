# État du projet

## Athena — première version locale

- Route : /tools/athena (anciennes routes schematic et db-designer redirigées).
- Canvas React Flow : déplacement, zoom, cadrage, minimap et création par bouton ou clic droit.
- Tables éditables sur le canvas : nom, ajout/suppression de colonnes, types PostgreSQL, nullable et clés primaires.
- Connexions de clé primaire à colonne, type propagé, cardinalités éditables et suppression des liens.
- Import/export .atlas.json version 1, validation structurelle et des références, limites de taille, avertissement avant fermeture/remplacement si modifications non exportées.
- Les projets sont en mémoire navigateur. Aucun compte, aucune base de données, aucune sauvegarde serveur ou localStorage. Exporter avant de fermer pour conserver son travail.
- Accueil Atlas retravaillé autour du premier outil disponible.
- Shell responsive : navigation Atlas déplacée dans un bandeau supérieur compact afin de préserver la largeur du canvas.
- L’explorateur des tables d’Athena est désormais un panneau superposé, fermé par défaut et accessible depuis la barre d’outils.
- Barre d’outils adaptée aux écrans de portable : libellés secondaires masqués progressivement et actions réparties sur deux lignes sur petit écran.

## Vérifications de cette tranche

Formatage, TypeScript, lint, build Next.js et 7 tests locaux réussis : registre, round-trip JSON, version/références invalides, suppression en cascade, propagation des types sans mutation et protection des clés référencées.

Parcours navigateur vérifié : ajout de table, renommage, ajout de colonne et connexion d’une clé primaire vers une colonne (type propagé).
Pas de vérification GitHub/CI distante systématique, conformément à la demande utilisateur.

## Limites et suite

Transformation MCD/MLD, génération FastAPI, export image et undo/redo restent à venir. Les relations N:N sont représentées mais ne génèrent pas encore de table de jointure. Le JSON est le format de projet portable, pas un export SQL.

Développement sur development ; aucune promotion préproduction/production demandée pour cette tranche.
