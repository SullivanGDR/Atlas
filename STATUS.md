# État du projet

## Export d’images Athena — 2026-09-30

- Bouton **Export** visible dans la barre d’Athena ; choix MCD / MLD / ERD, puis PNG / SVG, avec aperçu avant téléchargement.
- Rendu SVG natif généré depuis les données, indépendant du canvas, du zoom et du thème. Le PNG utilise exactement ce SVG, avec résolution doublée dans la limite de 8192 px par côté et 24 millions de pixels.
- Fond blanc, texte gris foncé, titre centré « MODÈLE — Nom du projet », tables réorganisées et centrées, signature « Made on Atlas by Athena » en bas à droite. Noms longs répartis sur plusieurs lignes ; bornes étendues aux relations et à leurs libellés.
- MCD sans clés étrangères ni types physiques ; MLD avec clés étrangères et tables de jointure ; ERD fidèle aux tables du schéma de travail. Aucune modification du projet lors de l’export.
- `pnpm check` réussi : formatage, lint, types, 26 tests et build. Tests dédiés : échappement XML, types réels, projections, centrage des auto-relations, indépendance des positions, table de 80 colonnes et projet vide.
- Aperçu MCD/MLD inspecté en navigateur sombre, génération PNG et SVG arrivée à son état de succès. L’outil navigateur n’a pas retourné les fichiers téléchargés : leur réception sur disque n’a pas été confirmée dans cette tranche.

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
- Le nouveau rendu image a été inspecté sur le schéma d’exemple à deux tables. Les très grands diagrammes et les croisements de nombreuses relations restent à vérifier visuellement ; privilégier SVG pour conserver la netteté.

Travail sur development. Aucune promotion préproduction/production incluse.
