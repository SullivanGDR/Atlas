# État du projet

## Export d’images Athena — 2026-09-30

- PNG et SVG cadrent désormais toutes les tables grâce aux bornes mesurées par React Flow, y compris quand elles dépassent la zone visible du canvas.
- Les types des colonnes sont rendus comme texte dans l’image exportée : les listes déroulantes ne retombent plus sur leur première option (`UUID`).
- Vérification en navigateur avec le schéma d’exemple à deux tables reliées : PNG inspecté, SVG téléchargé et affiché, types `VARCHAR` et `TIMESTAMP` contrôlés. `pnpm check` réussi (formatage, lint, types, 22 tests, build).

## Accueil et identité — 2026-09-30

- Aperçu Athena redessiné en SVG responsive : le lien 1:N rejoint précisément `users.id` et `projects.owner_id`, sans coordonnées CSS dépendantes de la taille de la carte.
- Accueil simplifié : hiérarchie éditoriale, détails utiles à la place des pastilles, navigation active soulignée. Palette gris clair/sombre conservée.
- Typographie IBM Plex Sans et IBM Plex Mono auto-hébergée ; aucun chargement de police depuis un service tiers au runtime.
- Vérifié en navigateur local à 1280 px et 390 px, en thèmes sombre et clair. `pnpm check` réussi : formatage, lint, types, 22 tests métier et build Next.js.

## Athena — éditeur et génération de backend

- Route : /tools/athena ; anciennes routes redirigées. Navigation alimentée par le registre d’outils.
- Interface monochrome, deux barres compactes, canvas pleine largeur et panneaux de propriétés superposés.
- Tables créées par bouton ou clic droit, duplication, suppression, déplacement et organisation automatique.
- Colonnes modifiables sur les nœuds ; panneau de contraintes : clé primaire, nullable, unique, longueur VARCHAR, précision/échelle NUMERIC et défaut SQL.
- Connexions dans les deux sens par glisser-déposer ou deux clics, points de connexion agrandis, reconnexion d’une extrémité et formulaire de relation. Les poignées sont recalculées après un changement de clé. Les boutons de suppression des colonnes sont regroupés dans les propriétés.
- Relations 1:1, 1:N, N:N, nom et ON DELETE (RESTRICT, CASCADE, SET NULL). Création automatique de colonne étrangère depuis le formulaire.
- Annuler/rétablir (Ctrl+Z, Ctrl+Maj+Z/Ctrl+Y), 80 étapes, frappe regroupée. Jusqu’à 20 versions de session, restaurables et exportables individuellement.
- Vues Éditeur, MCD et MLD. Projection pure : clés étrangères, références composites, contraintes uniques pour 1:1 et tables de jointure à clé composite pour N:N.
- Import/export de projets .atlas.json version 2 avec lecture des fichiers version 1. Import de structure SQL PostgreSQL (CREATE TABLE et ALTER TABLE ADD CONSTRAINT).
- Exports PNG/SVG du diagramme, SQL et ZIP FastAPI avec aperçu des fichiers.
- Partage en lecture seule par fragment d’URL compressé ; copie modifiable possible. Aucune donnée de projet stockée sur le serveur.

## Backend généré

Modèles SQLAlchemy 2, schémas Pydantic 2, routes CRUD paginées pour chaque table et ses clés simples/composites, migrations Alembic réversibles, database.py, main.py, requirements.txt, .env.example, Dockerfile, docker-compose.yml, scripts Windows/Unix et README.

L’export ZIP est calculé dans une route Next.js sans conservation du projet. La migration crée les tables avant les clés étrangères, ce qui permet les références cycliques. Les UUID primaires non référencés et SERIAL sont générés automatiquement. Les valeurs par défaut, références, champs obligatoires et contraintes uniques sont conservés.

## Vérifications effectuées

- pnpm check : formatage, lint, types, 22 tests métier et build Next.js réussis.
- Route HTTP d’export : ZIP lisible contenant les fichiers attendus ; projet invalide refusé.
- Projet blog généré exécuté avec FastAPI, SQLAlchemy, Pydantic et PostgreSQL 17.11 temporaire : démarrage, OpenAPI, correspondance modèles/migration, migrations upgrade/downgrade/upgrade, CRUD, défauts, clés composites, erreurs 404/409/422, RESTRICT et CASCADE.
- Script de reproduction : apps/web/scripts/verify-fastapi.py. Les ressources de test restent dans test-results, ignoré par Git.
- Pas de nouvelle vérification visuelle automatisée du navigateur pour cette tranche.

## Limites explicites

- Les projets et versions restent en mémoire : exporter le JSON avant fermeture. Les versions de session ne sont pas incluses dans le fichier courant ; chacune possède son propre bouton d’export.
- L’import SQL accepte les types représentables dans Athena. CHECK, tableaux SQL, types personnalisés, schémas autres que public, UNIQUE composites et instructions de données sont refusés explicitement. Import Prisma non implémenté ; l’import SQL couvre l’alternative de la roadmap.
- Génération avec noms snake_case non réservés, défauts SQL littéraux et fonctions usuelles autorisées. Le MLD est un aperçu ; les changements se font dans l’Éditeur.
- Le lien contient les données du schéma et représente une copie figée. Pour les grands projets, partager le JSON.
- Le CRUD généré est une base de développement sans authentification ni règles métier spécifiques.
- Les exports image ont été contrôlés en navigateur sur le schéma d’exemple à deux tables ; les très grands diagrammes n’ont pas été vérifiés visuellement.

Travail sur development. Aucune promotion préproduction/production incluse.
