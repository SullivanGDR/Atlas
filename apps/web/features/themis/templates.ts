import type { SpecProject } from "./model";

export const guides = [
  {
    id: "context",
    title: "Contexte et enjeux",
    question:
      "Quel problème faut-il résoudre, pour qui et pourquoi maintenant ?",
    prompts: [
      "Situation actuelle et limites observées",
      "Problème à résoudre et impacts",
      "Résultat attendu et raison du projet",
    ],
    example:
      "L’équipe traite aujourd’hui les demandes dans plusieurs fichiers. Le projet vise à centraliser leur suivi et à rendre les responsabilités explicites.",
  },
  {
    id: "goals",
    title: "Objectifs et indicateurs",
    question: "Comment saurez-vous que le projet est réussi ?",
    prompts: [
      "Objectifs métier et bénéfices attendus",
      "Indicateur, valeur de départ, cible et échéance",
      "Méthode de mesure et responsable",
    ],
    example:
      "Réduire le délai médian de traitement de 5 à 2 jours ouvrés dans les trois mois suivant la mise en service. Mesure sur les demandes clôturées.",
  },
  {
    id: "scope",
    title: "Périmètre et exclusions",
    question:
      "Qu’est-ce qui est inclus dans cette version et explicitement exclu ?",
    prompts: [
      "Fonctions, populations et sites couverts",
      "Livrables attendus",
      "Hors périmètre et évolutions ultérieures",
    ],
    example:
      "La première version couvre la création et le suivi des demandes internes. La facturation et l’application mobile native sont hors périmètre.",
  },
  {
    id: "people",
    title: "Utilisateurs et gouvernance",
    question: "Qui utilise, décide, réalise et valide ?",
    prompts: [
      "Profils utilisateurs et droits respectifs",
      "Commanditaire et décideur",
      "Équipe projet, interlocuteurs et validation des changements",
    ],
    example:
      "Les collaborateurs déposent des demandes ; les gestionnaires les affectent. Le responsable métier arbitre les priorités et valide la recette.",
  },
  {
    id: "journeys",
    title: "Parcours et règles métier",
    question: "Décrivez les cas courants, exceptions et règles de décision.",
    prompts: [
      "Parcours principal de bout en bout",
      "Règles de gestion et cas limites",
      "Erreurs, refus et alternatives",
    ],
    example:
      "Un demandeur saisit le motif, vérifie les informations puis confirme. Une demande incomplète reste en brouillon et les champs manquants sont indiqués.",
  },
  {
    id: "data",
    title: "Données et échanges",
    question: "Quelles données circulent et avec quels systèmes ?",
    prompts: [
      "Données, sources, volumes et qualité attendue",
      "Interfaces, formats, fréquence et responsables",
      "Migration, conservation, suppression et réversibilité",
    ],
    example:
      "Les données de référence proviennent d’un fichier CSV validé par l’équipe métier. Les lignes rejetées sont listées avec le motif de rejet.",
  },
  {
    id: "quality",
    title: "Qualité et contraintes techniques",
    question: "Quelles limites mesurables encadrent la solution ?",
    prompts: [
      "Performance, charge et conditions de mesure",
      "Disponibilité, sauvegarde, reprise et exploitation",
      "Navigateurs, hébergement, intégrations et contraintes imposées",
    ],
    example:
      "Le temps de réponse du parcours de consultation est mesuré au 95e percentile, avec la charge et le jeu de données définis dans le protocole de recette.",
  },
  {
    id: "security",
    title: "Sécurité et confidentialité",
    question:
      "Qui peut accéder aux données et comment vérifier leur protection ?",
    prompts: [
      "Authentification, autorisations et traçabilité",
      "Nature des données, minimisation et conservation",
      "Mesures, tests et obligations à faire confirmer par les responsables compétents",
    ],
    example:
      "Un utilisateur ne peut consulter que les demandes autorisées par son rôle. La recette couvre les accès permis et refusés pour chaque profil.",
  },
  {
    id: "design",
    title: "Expérience et accessibilité",
    question:
      "Quelles attentes d’usage et d’accessibilité doivent être vérifiées ?",
    prompts: [
      "Identité visuelle, écrans et contenus",
      "Responsive, navigation clavier et lecteurs d’écran",
      "Référentiel retenu et méthode d’évaluation",
    ],
    example:
      "Le parcours principal est utilisable au clavier, avec un ordre de focus cohérent et une indication visible de l’élément sélectionné.",
  },
  {
    id: "delivery",
    title: "Planning et livrables",
    question:
      "Quels jalons, dépendances et livrables rendent le projet pilotable ?",
    prompts: [
      "Étapes, dates visées et dépendances",
      "Livrables de chaque étape et responsable",
      "Déploiement, documentation, formation et accompagnement",
    ],
    example:
      "La maquette est validée avant le développement du parcours. La livraison inclut le code source, la procédure de déploiement et un guide utilisateur.",
  },
  {
    id: "budget",
    title: "Budget et moyens",
    question: "Quelles ressources et quels coûts faut-il prévoir ?",
    prompts: [
      "Enveloppe, hypothèses et postes de dépense",
      "Coûts de réalisation et coûts récurrents",
      "Disponibilités des équipes et arbitrages",
    ],
    example:
      "Distinguer le coût initial des coûts annuels d’hébergement, maintenance et support. Les hypothèses de volumétrie accompagnent chaque estimation.",
  },
  {
    id: "risks",
    title: "Risques et hypothèses",
    question:
      "Qu’est-ce qui pourrait empêcher la réussite et que faire dans ce cas ?",
    prompts: [
      "Hypothèses à confirmer et décisions ouvertes",
      "Risques, probabilité et impact",
      "Mesure préventive, responsable et échéance",
    ],
    example:
      "Risque : retard de l’interface partenaire. Mesure : valider un contrat d’échange et prévoir un jeu de données de test avant le début des développements.",
  },
  {
    id: "acceptance",
    title: "Recette et validation",
    question:
      "Qui vérifie quoi, avec quelles preuves et quelles règles d’acceptation ?",
    prompts: [
      "Environnement, données et protocole de recette",
      "Preuves attendues pour chaque exigence",
      "Traitement des anomalies, réserves et approbateurs",
    ],
    example:
      "Chaque exigence du périmètre dispose d’un test et d’un résultat consigné. Le responsable métier prononce la validation après traitement des anomalies bloquantes.",
  },
  {
    id: "maintenance",
    title: "Maintenance et réversibilité",
    question: "Comment la solution sera-t-elle maintenue et transmise ?",
    prompts: [
      "Support, niveaux de service et responsabilités",
      "Mises à jour, supervision et maintenance",
      "Remise des accès, données, sources et procédure de sortie",
    ],
    example:
      "La remise finale comprend l’inventaire des accès, les sources, la documentation et une procédure permettant d’exporter les données dans un format documenté.",
  },
  {
    id: "glossary",
    title: "Glossaire et références",
    question: "Quels termes, documents ou décisions doivent être partagés ?",
    prompts: [
      "Termes métier et acronymes",
      "Documents de référence et versions",
      "Historique des décisions et modifications",
    ],
    example:
      "Recette : vérification formelle que la livraison satisfait les critères convenus. Référence : compte rendu de cadrage validé par le commanditaire.",
  },
];
export const templates = [
  {
    id: "general",
    name: "Projet sur mesure",
    description: "Un cadre complet à adapter à votre besoin.",
  },
  {
    id: "web",
    name: "Application web",
    description: "Parcours, rôles, données, API et mise en service.",
  },
  {
    id: "website",
    name: "Site vitrine",
    description: "Contenus, arborescence, référencement et accessibilité.",
  },
  {
    id: "infrastructure",
    name: "Infrastructure SI",
    description: "Architecture, migration, continuité et exploitation.",
  },
] as const;
export type TemplateId = (typeof templates)[number]["id"];
const specific: Record<TemplateId, Record<string, string[]>> = {
  general: {},
  web: {
    journeys: [
      "Rôles et habilitations",
      "Parcours principal et exceptions",
      "Notifications et règles métier",
    ],
    data: [
      "Entités métier et sources",
      "API, contrats et authentification",
      "Migration et export des données",
    ],
  },
  website: {
    journeys: [
      "Arborescence et parcours de navigation",
      "Gestion et validation des contenus",
      "Formulaires, recherche et contact",
    ],
    quality: [
      "Référencement technique et redirections",
      "Performance des pages et mesure",
      "CMS, hébergement et navigateurs",
    ],
  },
  infrastructure: {
    scope: [
      "Sites, environnements et services concernés",
      "Équipements et prestations inclus",
      "Services exclus et dépendances",
    ],
    delivery: [
      "Inventaire et conception de la cible",
      "Migration, bascule et retour arrière",
      "Transfert à l’exploitation",
    ],
    quality: [
      "Capacité et charge de référence",
      "Objectifs de reprise et perte de données admissible",
      "Supervision et tests de restauration",
    ],
  },
};
export function sectionPrompts(template: TemplateId, id: string) {
  return (
    specific[template][id] ?? guides.find((g) => g.id === id)?.prompts ?? []
  );
}
export function createProject(template: TemplateId = "general"): SpecProject {
  return {
    name:
      template === "general"
        ? "Mon cahier des charges"
        : templates.find((t) => t.id === template)!.name,
    template,
    client: "",
    author: "",
    version: "0.1",
    date: "",
    status: "Brouillon",
    confidentiality: "Interne",
    nextRequirement: 1,
    requirements: [],
    sections: guides.map((g) => ({
      id: g.id,
      title: g.title,
      content: "",
      included: true,
      reviewed: false,
    })),
  };
}
export function outlineFor(template: TemplateId, id: string) {
  return sectionPrompts(template, id)
    .map((p) => `## ${p}\n[À préciser]`)
    .join("\n\n");
}
