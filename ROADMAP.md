# Roadmap — Atlas

> Priorité utilisateur — Athena : aucun compte ni base de données du site. Projets portables par import/export .atlas.json ; état navigateur en mémoire. Les étapes Prisma/Neon/Auth.js et sauvegarde distante ci-dessous sont abandonnées. Validation locale ciblée, sans vérification GitHub systématique.

> Mise à jour utilisateur du 2026-09-05 : nom définitif Atlas. Développement local et pushes sur development ; promotion volontaire en preprod pour Vercel ; production sur main en fin de grosse fonctionnalité validée. Cette règle remplace toute mention ci-dessous d’un déploiement à chaque push.
### Feuille de route technique pour agent IA (Claude Code / Codex / Cursor)

> Ce document est une spécification d'exécution. Toute IA qui reprend ce fichier doit suivre les décisions techniques prises ici **sans les remettre en question**, sauf contrainte technique bloquante rencontrée en cours de route (auquel cas : documenter l'écart dans `DECISIONS.md` à la racine du repo).

---

## 0. Vision du projet

**Atlas** est une application web unique (un "hub") qui regroupe une collection d'outils sur-mesure destinés à accélérer des projets d'études et personnels : conception de bases de données, générateurs de code, utilitaires divers. Chaque outil est un module indépendant à l'intérieur d'un même site, avec une navigation commune, un thème commun, et une DA cohérente.

Le premier outil (`db-designer`) est un concepteur de bases de données visuel :
- construction d'un **MCD** (Modèle Conceptuel de Données) puis d'un **MLD** (Modèle Logique de Données),
- liaison des tables (relations 1-1, 1-N, N-N), gestion des clés primaires/étrangères, types, contraintes,
- rendu visuel propre exportable (image),
- **export direct** : arborescence de fichiers prête à coller dans un projet **FastAPI + PostgreSQL** (modèles SQLAlchemy, schémas Pydantic, migration Alembic, routers CRUD).

Contrainte forte : **hébergement gratuit**, donc toutes les décisions de stack sont filtrées par "est-ce que ça tient dans un free tier durable ?".

---

## 1. Principes directeurs pour l'agent IA

1. **Ne pas réinventer la stack à chaque session.** La stack ci-dessous est figée. Si un changement est nécessaire, il doit être écrit dans `DECISIONS.md` avec la raison.
2. **Un outil = un module isolé.** Aucun outil ne doit dépendre du code interne d'un autre outil. La communication passe uniquement par des types/contrats partagés (`packages/shared`).
3. **Le shell (coquille du site) est stable, les outils sont additifs.** On ne doit jamais avoir à retoucher la navigation principale pour ajouter un outil n°6.
4. **Tout ce qui peut être un composant réutilisable (bouton, carte, modale, canvas générique) va dans `packages/ui`.**
5. **Free tier first.** Pas de service payant par défaut. Si une fonctionnalité nécessite un service payant, elle doit être optionnelle et désactivable.
6. **Le code généré pour l'utilisateur (l'export FastAPI) doit être lisible et idiomatique**, comme si un développeur senior l'avait écrit à la main — pas du code "template" avec des commentaires robotiques.

---

## 2. Stack technique retenue

| Brique | Choix | Raison |
|---|---|---|
| Framework front | **Next.js 14+ (App Router)**, TypeScript strict | Déploiement natif Vercel, SSR/CSR au choix, écosystème énorme |
| UI Kit de base | **shadcn/ui** (Radix + Tailwind) fortement personnalisé | Composants accessibles, pas de style "par défaut" visible → base neutre pour la DA custom |
| Style | **Tailwind CSS** + variables CSS pour les thèmes clair/sombre | Standard, léger, pas de runtime CSS-in-JS |
| Canvas / éditeur de diagrammes | **React Flow (@xyflow/react)** | Fait exactement ce qu'il faut pour des nœuds (tables) reliés par des arêtes (relations), gère zoom/pan/minimap, très personnalisable visuellement |
| Export image du diagramme | `html-to-image` (rendu du canvas en PNG/SVG) | Léger, pas de dépendance serveur |
| État global front | **Zustand** | Plus simple que Redux, parfait pour l'état d'un éditeur (nœuds, arêtes, sélection) |
| Backend API du site (léger) | **Next.js Route Handlers** (API routes) en TypeScript | Suffisant pour CRUD projets, auth, génération de code (pas besoin d'un vrai serveur Python séparé pour le site lui-même) |
| Moteur de génération de code FastAPI | Génération **côté serveur en TypeScript** (templates de string + formatage), packagée en `.zip` | Pas besoin de faire tourner Python sur Vercel : on génère du texte Python, pas on exécute du Python |
| Base de données du toolbox (comptes, projets sauvegardés) | **PostgreSQL managé gratuit : Neon** (ou Supabase en alternative) | Serverless Postgres, tier gratuit généreux, compatible Vercel (pas de connexions persistantes bloquantes) |
| ORM | **Prisma** (ou Drizzle si préférence légèreté) | Migrations propres, typage automatique |
| Authentification | **Auth.js (NextAuth)** avec provider GitHub/Google gratuits | Pas de service payant, login pertinent pour un public dev |
| Hébergement front + API | **Vercel (plan Hobby, gratuit)** | Demandé explicitement, intégration Next.js parfaite |
| Monorepo | **Turborepo + pnpm workspaces** | Permet d'ajouter des outils sans complexifier le déploiement (un seul projet Vercel déployé) |
| Lint / format | ESLint + Prettier + TypeScript strict | Cohérence du code sur la durée |
| Tests | Vitest (unitaire) + Playwright (E2E léger, optionnel) | Standard, gratuit en CI GitHub Actions |
| CI/CD | GitHub Actions (gratuit pour repo perso) + déploiement auto Vercel sur push | Zéro coût |

**Ce que ce projet n'est PAS** : pas de vrai serveur FastAPI hébergé en permanence pour le toolbox lui-même. L'outil `db-designer` **génère** du code FastAPI destiné à être utilisé *ailleurs* par l'utilisateur (dans ses propres projets), il n'exécute pas FastAPI en production sur Vercel.

---

## 3. Architecture du dépôt (monorepo)

```
atlas/
├── apps/
│   └── web/                      # L'application Next.js principale (le site)
│       ├── app/
│       │   ├── (marketing)/      # Page d'accueil, présentation du toolbox
│       │   ├── (app)/
│       │   │   ├── dashboard/    # Liste des projets de l'utilisateur
│       │   │   └── tools/
│       │   │       └── db-designer/   # Route de l'outil n°1
│       │   └── api/
│       │       ├── auth/
│       │       └── tools/db-designer/export/   # Route Handler de génération de code
│       ├── features/
│       │   └── db-designer/      # Logique métier propre à l'outil (isolée)
│       │       ├── components/   # Canvas, nœud "table", panneau propriétés...
│       │       ├── model/        # Types : Entity, Attribute, Relation...
│       │       ├── transforms/   # MCD -> MLD
│       │       ├── generators/   # Générateurs de code (sqlalchemy, pydantic, alembic...)
│       │       └── store/        # Zustand store de l'éditeur
│       └── ...
├── packages/
│   ├── ui/                       # Design system partagé (Button, Card, ThemeToggle...)
│   ├── shared/                   # Types/contrats partagés entre outils
│   └── config/                   # Config ESLint/Tailwind/TSConfig partagée
├── DECISIONS.md                  # Journal des écarts par rapport à cette roadmap
└── ROADMAP.md                    # Ce document
```

**Règle clé** : quand on ajoutera l'outil n°2, il ira dans `apps/web/features/<outil-2>/` avec exactement la même structure interne. Rien dans `packages/` ne doit connaître l'existence de `db-designer` spécifiquement.

---

## 4. Direction artistique (DA)

Objectif explicite : **ne pas ressembler à un site "vibecodé"** (dégradés violet/rose partout, glassmorphism générique, emoji en guise d'icônes, hero section avec gros titre en gradient). On vise quelque chose qui ressemble davantage à **Linear, Raycast, Vercel dashboard, ou GitHub** : sobre, dense en information utile, typographie soignée, très peu de couleur — la couleur devient un signal (statut, accent), pas une décoration.

### 4.1 Thèmes clair / sombre

- Palette **neutre à dominante quasi-monochrome** (gris/noir/blanc) + **une seule couleur d'accent**, définie une fois et utilisée avec parcimonie (liens actifs, boutons primaires, focus ring).
- Utiliser des **tokens CSS** (`--background`, `--foreground`, `--border`, `--accent`, `--muted`) définis dans `:root` et `[data-theme="dark"]`, jamais de couleurs "en dur" dans les composants.
- Pas de dégradés décoratifs. Un dégradé n'est acceptable que comme micro-détail (ex: léger halo derrière un logo), jamais comme fond de page ou fond de bouton.
- Contraste élevé, mode sombre en **gris anthracite** (pas noir pur `#000`), mode clair en **blanc cassé** (pas blanc pur `#fff`) pour moins fatiguer l'œil.

### 4.2 Typographie

- Une police **sans-serif** pour l'interface (ex: Inter, Geist, ou IBM Plex Sans) + une police **monospace** pour tout ce qui est technique : noms de tables, types de colonnes, code généré (ex: JetBrains Mono, Geist Mono).
- Hiérarchie typographique stricte et réduite (3-4 tailles maximum sur une page), pas d'empilement de titres géants.
- Le monospace est un marqueur fort de la DA "outil pour développeur" — l'utiliser dans les labels de champs techniques donne immédiatement un ton "sérieux/pro".

### 4.3 Composants & style d'interface

- Bordures fines (1px), rayons de coin modérés (6-8px, pas de `rounded-3xl` partout), ombres quasi inexistantes ou très subtiles.
- Densité d'information assumée : ce n'est pas un site marketing, c'est un outil de travail. Pas peur des tableaux, des listes denses, des panneaux latéraux.
- Le canvas de l'éditeur de BDD doit ressembler à un vrai outil (type Excalidraw / dbdiagram.io) : grille discrète en fond, nœuds "table" avec un header sobre (nom de la table) et des lignes de colonnes avec icônes discrètes (clé pour PK, lien pour FK).
- Micro-interactions discrètes (transitions 150-200ms), pas d'animations spectaculaires.

### 4.4 Ce qu'on évite absolument

- Dégradés violet → rose → bleu en fond de hero.
- Glassmorphism (fond flouté translucide) en usage systématique.
- Emoji comme icônes fonctionnelles (utiliser une seule librairie d'icônes cohérente, ex: `lucide-react`).
- Illustrations 3D génériques "IA" (robots, cerveaux, réseaux de neurones stylisés).
- Boutons "glow" ou effets néon.

---

## 5. Roadmap par phases

### Phase 0 — Socle (1 session)
- Init monorepo Turborepo + pnpm.
- Config Tailwind + shadcn/ui + tokens de thème clair/sombre.
- Mise en place `packages/ui` avec les 5-6 composants de base (Button, Card, Input, Dialog, ThemeToggle, Sidebar).
- Déploiement Vercel initial (page "Hello Atlas") pour valider la chaîne de bout en bout.

### Phase 1 — Shell applicatif du toolbox (1 session)
- Layout principal : navigation supérieure compacte entre les outils, avec bascule de thème ; les panneaux propres aux outils sont escamotables pour préserver leur espace de travail.
- Page d'accueil listant les outils disponibles (cards).
- Authentification (Auth.js + provider GitHub) — permet de rattacher des projets sauvegardés à un compte.
- Modèle Prisma minimal : `User`, `Project` (un `Project` a un `type` d'outil + un `data` JSON).

### Phase 2 — Outil n°1 : `db-designer`, éditeur visuel (2-3 sessions)
- Canvas React Flow : créer/déplacer/supprimer des nœuds "table".
- Panneau latéral : édition d'une table (nom, colonnes avec type/nullable/unique/défaut).
- Création de relations par glisser-déposer entre deux tables, avec choix de cardinalité (1-1, 1-N, N-N).
- Détection automatique clé primaire / clé étrangère selon la relation.
- Sauvegarde du diagramme en base (JSON du graphe) liée au compte utilisateur.
- Export image (PNG/SVG) du diagramme.

### Phase 3 — Moteur d'export FastAPI + PostgreSQL (2 sessions)
- Transformation MCD → MLD (voir §6.3).
- Générateurs de code : SQLAlchemy models, Pydantic schemas, migration Alembic, routers CRUD FastAPI basiques, `docker-compose.yml` pour Postgres local, `.env.example`, `requirements.txt`.
- Packaging en `.zip` téléchargeable, avec une arborescence de projet FastAPI complète et fonctionnelle "out of the box".

### Phase 4 — Confort utilisateur (1-2 sessions)
- Historique des versions d'un projet (undo/redo, snapshots).
- Partage en lecture seule d'un diagramme via lien.
- Import d'un schéma existant (upload d'un `.sql` ou d'un schéma Prisma) pour repartir d'un existant.

### Phase 5 — Extensibilité (continu)
- Ajout d'un outil n°2, n°3... en suivant strictement la structure `features/<outil>/` définie en §3.
- Idées déjà identifiées à garder en tête pour la cohérence du shell : générateur de JWT/regex testeur, générateur de mock data, générateur de diagrammes de séquence/architecture, générateur de fichiers de config (Docker, CI).

---

## 6. Spécification détaillée de l'outil n°1 (`db-designer`)

### 6.1 Modèle de données interne

```ts
type ColumnType =
  | "INTEGER" | "BIGINT" | "SERIAL" | "VARCHAR" | "TEXT"
  | "BOOLEAN" | "DATE" | "TIMESTAMP" | "NUMERIC" | "UUID" | "JSONB";

interface Attribute {
  id: string;
  name: string;
  type: ColumnType;
  length?: number;          // pour VARCHAR(n)
  nullable: boolean;
  unique: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
}

interface Entity {
  id: string;
  name: string;             // nom de la future table
  attributes: Attribute[];
  position: { x: number; y: number };  // position sur le canvas
}

type Cardinality = "1-1" | "1-N" | "N-N";

interface Relation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  cardinality: Cardinality;
  name?: string;            // nom de l'association (utile en N-N pour nommer la table de jointure)
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
}

interface Schema {
  id: string;
  name: string;
  entities: Entity[];
  relations: Relation[];
}
```

### 6.2 Éditeur visuel (canvas)

- Chaque `Entity` = un nœud React Flow custom (`TableNode`) affichant : nom de la table en header, liste des colonnes avec icône clé (🔑 → remplacer par icône `lucide` `KeyRound`) pour la PK et icône lien pour les FK.
- Chaque `Relation` = une arête React Flow custom, avec un label affichant la cardinalité (ex: `1 —— N`), style de trait différent selon 1-1 / 1-N / N-N.
- Panneau de propriétés (drawer latéral) qui s'ouvre au clic sur un nœud ou une arête, pour éditer ses détails sans encombrer le canvas.
- Barre d'outils flottante : zoom, ajustement automatique, export image, bascule MCD/MLD.

### 6.3 Passage MCD → MLD

Le MCD est la vue "conceptuelle" (entités + associations, sans se soucier des clés étrangères). Le MLD est la vue "logique" prête pour la base de données. Règles de transformation à implémenter dans `transforms/mcdToMld.ts` :

1. **Relation 1-1** → la clé primaire d'une des deux entités (la plus "dépendante") est ajoutée comme clé étrangère unique dans l'autre.
2. **Relation 1-N** → la clé primaire de l'entité "1" est ajoutée comme clé étrangère dans l'entité "N".
3. **Relation N-N** → génération automatique d'une **table de jointure** (nom = `nom1_nom2` ou nom de l'association si fourni) contenant les deux clés étrangères, qui forment ensemble la clé primaire composite.
4. Les types de clé étrangère héritent du type de la clé primaire référencée.

Le MLD résultant est la structure réellement utilisée pour la génération de code (§6.4).

### 6.4 Moteur de génération de code

Pour chaque `Entity` du MLD, générer :

- **`models/<entity>.py`** — classe SQLAlchemy (Declarative Base), avec les colonnes, types SQLAlchemy correspondants, `relationship()` pour les FK.
- **`schemas/<entity>.py`** — modèles Pydantic : `<Entity>Base`, `<Entity>Create`, `<Entity>Read` (avec `model_config = ConfigDict(from_attributes=True)`).
- **`routers/<entity>.py`** — routes CRUD basiques (`GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`) utilisant une session SQLAlchemy injectée par dépendance.
- **`alembic/versions/0001_initial.py`** — migration initiale complète (`create_table` pour chaque entité, dans le bon ordre topologique en tenant compte des FK).
- Fichiers transverses générés une seule fois : `database.py` (engine + session), `main.py` (inclusion des routers), `requirements.txt`, `.env.example`, `docker-compose.yml` (service Postgres local), `README.md` expliquant comment lancer le projet.

Le code doit être généré via un système de **templates** (littéraux de gabarits + interpolation), pas de LLM à l'exécution : c'est déterministe, rapide, gratuit, et ça tient dans une fonction serverless Vercel sans souci de timeout.

### 6.5 Arborescence livrée à l'utilisateur (exemple)

```
export.zip
└── backend/
    ├── app/
    │   ├── models/
    │   │   ├── user.py
    │   │   └── post.py
    │   ├── schemas/
    │   │   ├── user.py
    │   │   └── post.py
    │   ├── routers/
    │   │   ├── user.py
    │   │   └── post.py
    │   ├── database.py
    │   └── main.py
    ├── alembic/
    │   ├── env.py
    │   └── versions/0001_initial.py
    ├── requirements.txt
    ├── docker-compose.yml
    ├── .env.example
    └── README.md
```

---

## 7. Checklist d'implémentation pas-à-pas (pour l'agent IA)

À suivre dans l'ordre. Chaque étape doit être commit-able indépendamment.

- [x] 1. Initialiser le monorepo (`pnpm init`, `turbo.json`, workspaces).
- [x] 2. Créer `apps/web` (Next.js 14, TS strict, Tailwind, shadcn/ui).
- [x] 3. Définir les tokens de thème (clair/sombre) dans `packages/config` et les brancher dans `apps/web`.
- [x] 4. Construire `packages/ui` avec les composants de base + `ThemeToggle`.
- [x] 5. Déployer sur Vercel (page d'accueil minimale) — valider que la CI est verte.
- [ ] 6. Ajouter Prisma + Neon (ou Supabase), modèles `User`/`Project`.
- [ ] 7. Ajouter Auth.js (provider GitHub), page login, protection des routes `(app)`.
- [x] 8. Construire le layout du shell (sidebar + navigation outils).
- [x] 9. Créer `features/db-designer` avec le store Zustand et les types du §6.1.
- [x] 10. Implémenter le canvas React Flow avec `TableNode` custom (sans encore les relations).
- [x] 11. Implémenter le panneau d'édition d'une table (ajout/suppression de colonnes).
- [x] 12. Implémenter la création de relations (edges custom + choix de cardinalité).
- [ ] 13. Implémenter la sauvegarde/chargement d'un `Schema` en base via Prisma.
- [ ] 14. Implémenter l'export image (PNG/SVG) du canvas.
- [ ] 15. Implémenter `transforms/mcdToMld.ts` avec tests unitaires sur les 3 cas de cardinalité.
- [ ] 16. Implémenter les générateurs de code (§6.4), un fichier de template à la fois, avec tests de snapshot.
- [ ] 17. Implémenter la route d'export `.zip` (Route Handler Next.js).
- [ ] 18. Tester l'ensemble sur un cas concret (ex: schéma "blog" avec User/Post/Comment/Tag en N-N) : générer le zip, lancer le projet FastAPI généré localement, vérifier qu'il démarre et que les migrations passent.
- [ ] 19. Polish DA finale (§4) sur l'ensemble du parcours.
- [x] 20. Documenter dans `README.md` comment ajouter un nouvel outil (checklist courte pour la Phase 5).

---

## 8. Points d'attention Vercel (plan Hobby gratuit)

- **Timeout des fonctions serverless** : ~10 secondes sur le plan Hobby. La génération de code étant de la simple interpolation de templates (pas de calcul lourd), ça ne pose pas de problème — à garder en tête si un futur outil fait des traitements plus lourds (dans ce cas, découper en étapes ou déporter vers une queue externe gratuite type Inngest/QStash tier gratuit).
- **Pas de base de données locale sur Vercel** : obligatoire de passer par un Postgres externe (Neon/Supabase) compatible connexions serverless (pooling via `pgbouncer` ou driver HTTP Neon).
- **Limite de taille de payload** des Route Handlers : le `.zip` généré doit rester raisonnable (un export de schéma classique fait quelques dizaines de Ko à quelques Mo, largement dans les limites).
- **Pas de websocket persistant natif** sur les fonctions serverless classiques : si un futur outil nécessite du temps réel (ex: édition collaborative du diagramme), prévoir un service externe gratuit dédié (ex: Liveblocks free tier) plutôt que d'essayer de le faire "à la main" sur Vercel.

---

## 9. Glossaire rapide (Merise)

- **MCD (Modèle Conceptuel de Données)** : représente les entités du métier et leurs associations, sans se soucier de l'implémentation (pas de clé étrangère explicite).
- **MLD (Modèle Logique de Données)** : traduction du MCD en tables avec clés primaires et clés étrangères, prêt à être implémenté dans un SGBD relationnel.
- **Cardinalité** : nombre d'occurrences possibles d'une entité dans une association (1-1, 1-N, N-N).
- **Clé primaire (PK)** : identifiant unique d'une ligne dans une table.
- **Clé étrangère (FK)** : référence vers la clé primaire d'une autre table, matérialisant une relation.
- **Table de jointure (ou table associative)** : table intermédiaire créée pour matérialiser une relation N-N, contenant les FK des deux tables liées.

---

*Fin du document. Toute session future doit relire ce fichier avant de reprendre le développement, et mettre à jour la checklist §7 au fur et à mesure de l'avancement.*
