# État du projet

## Iris — première version de cartographie SI, 2026-09-30

- Onglet Outils retiré. Navigation directe Iris / Athena ; accueil accessible par le logo Atlas. Iris enregistré et présenté sur l’accueil.
- Canvas pleine largeur, catalogue et propriétés escamotables, palette neutre. 22 entrées dont neuf logos officiels embarqués localement ; recherche et catégories.
- Services par bouton, clic droit ou glisser depuis le catalogue ; zones imbriquées, regroupement automatique des services déposés à l’intérieur, déplacement groupé, redimensionnement et dissolution sans supprimer le contenu.
- Flux dirigés, reconnexion, création par poignées ou formulaire, nom, protocole, synchrone/asynchrone et bidirectionnel. Métadonnées : description, responsable, technologie, environnement, criticité.
- Organisation récursive, duplication de services, annuler/rétablir sur 60 étapes. Import/export `.atlas.json` versionné et validé ; données en mémoire navigateur, aucun compte ou stockage serveur.
- PNG et SVG autonomes, titre et signature Iris, logos incorporés, indépendants du zoom. Fichiers PNG et SVG téléchargés retrouvés sur disque ; rendu SVG rasterisé et inspecté.
- Vérifié dans le navigateur local : ajout Kubernetes, changement de zone, responsable, création d’un flux, organisation, déplacement de zone avec ses services et annulation. Contrôle complet `pnpm check` réussi : formatage, lint sans avertissement, types, 35 tests et build Next.js.
- Première tranche : cartographie manuelle, sans découverte automatique ni synchronisation cloud. Catalogue extensible ; le routage n’évite pas tous les obstacles sur des cartes denses. Les noms longs sont tronqués dans les cartes/images et restent intégraux dans le fichier projet.

## Export d’images Athena — 2026-09-30

- Bouton **Export** visible dans la barre d’Athena ; choix MCD / MLD / ERD, puis PNG / SVG, avec aperçu avant téléchargement.
- Rendu SVG natif généré depuis les données, indépendant du canvas, du zoom et du thème. Le PNG utilise exactement ce SVG, avec résolution doublée dans la limite de 8192 px par côté et 24 millions de pixels.
- Fond gris perle, texte gris foncé, titre centré « MODÈLE — Nom du projet », tables réorganisées et centrées, signature « Made on Atlas by Athena » en bas à droite. Noms longs répartis sur plusieurs lignes ; bornes étendues aux relations et à leurs libellés.
- Barre principale compacte (50 px), boutons Export/Générer de 32 px sans aplat blanc. Options et bouton de téléchargement allégés.
- Export MCD : hauteur calculée uniquement sur les champs visibles, cartes alignées en haut de chaque rangée, sans réserve pour les FK cachées. Les tables de jointure supplémentaires restent propres au MLD.
- Canvas : Organiser les tables est disponible en MCD et MLD, avec disposition locale propre à la projection ; aucune modification des données ou positions de l’Éditeur. Chaque relation MCD a un point distinct sur le corps de la carte, réparti par côté, avec raccord haut/bas pour les tables alignées verticalement.
- Lisibilité : noms de champs à 17 px, titres de tables à 20 px, lignes espacées. Aperçu ajusté à la largeur sans réduction forcée à 340 px de haut, défilement et bouton 100 %. En MCD, cardinalités aux extrémités sans pastille centrale ; liaisons verticales directes entre voisins alignés.
- MCD sans clés étrangères ni types physiques ; MLD avec clés étrangères et tables de jointure ; ERD fidèle aux tables du schéma de travail. Aucune modification du projet lors de l’export.
- `pnpm check` réussi : formatage, lint, types, 29 tests et build. Tests dédiés : échappement XML, types réels, projections, centrage des auto-relations, indépendance des positions, table de 80 colonnes, projet vide, compaction MCD, séparation des liaisons, raccord vertical direct et taille des champs sur quatre tables. Tests additionnels de disposition projetée et de non-mutation de l’Éditeur.
- Barre compacte inspectée en navigateur sombre ; exports MCD/MLD à quatre tables rendus en PNG et inspectés, avec cartes MCD compactées et légende espacée. Organisation MCD testée dans le navigateur sur trois tables, bouton actif et aucune erreur console. Génération PNG et SVG arrivée à son état de succès lors de la tranche précédente. L’outil navigateur n’a pas retourné les fichiers téléchargés : leur réception sur disque n’a pas été confirmée dans cette tranche.

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
