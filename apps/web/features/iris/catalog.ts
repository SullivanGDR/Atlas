export type ServiceDefinition = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon:
    | "app"
    | "server"
    | "database"
    | "cloud"
    | "person"
    | "network"
    | "shield"
    | "queue"
    | "monitor";
  logo?: string;
  source?: string;
};
const cncf = (id: string) => ({
  logo: `/iris/logos/${id}.svg`,
  source: `https://github.com/cncf/artwork/tree/main/projects/${id}`,
});
export const catalog: ServiceDefinition[] = [
  {
    id: "application",
    name: "Application",
    category: "Applications",
    description: "Application métier ou service interne",
    icon: "app",
  },
  {
    id: "web",
    name: "Site web",
    category: "Applications",
    description: "Portail, frontend ou application web",
    icon: "app",
  },
  {
    id: "api",
    name: "API",
    category: "Applications",
    description: "API REST, GraphQL ou service backend",
    icon: "server",
  },
  {
    id: "saas",
    name: "Service SaaS",
    category: "Applications",
    description: "Application externe ou partenaire",
    icon: "cloud",
  },
  {
    id: "person",
    name: "Utilisateurs",
    category: "Organisation",
    description: "Acteurs, équipe ou population utilisatrice",
    icon: "person",
  },
  {
    id: "server",
    name: "Serveur",
    category: "Infrastructure",
    description: "Machine physique ou virtuelle",
    icon: "server",
  },
  {
    id: "cloud",
    name: "Cloud",
    category: "Infrastructure",
    description: "Hébergement ou fournisseur cloud",
    icon: "cloud",
  },
  {
    id: "network",
    name: "Réseau",
    category: "Infrastructure",
    description: "Réseau, sous-réseau ou équipement",
    icon: "network",
  },
  {
    id: "firewall",
    name: "Pare-feu",
    category: "Sécurité",
    description: "Filtrage et frontière de confiance",
    icon: "shield",
  },
  {
    id: "gateway",
    name: "Passerelle",
    category: "Infrastructure",
    description: "Reverse proxy, routeur ou load balancer",
    icon: "network",
  },
  {
    id: "database",
    name: "Base de données",
    category: "Données",
    description: "Stockage relationnel ou documentaire",
    icon: "database",
  },
  {
    id: "storage",
    name: "Stockage",
    category: "Données",
    description: "Fichiers, objets ou sauvegardes",
    icon: "database",
  },
  {
    id: "queue",
    name: "File de messages",
    category: "Données",
    description: "Bus événementiel ou échanges asynchrones",
    icon: "queue",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "Données",
    description: "Base de données relationnelle",
    icon: "database",
    logo: "/iris/logos/postgresql.svg",
    source: "https://wiki.postgresql.org/wiki/Logo",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "Infrastructure",
    description: "Orchestration de conteneurs",
    icon: "cloud",
    ...cncf("kubernetes"),
  },
  {
    id: "envoy",
    name: "Envoy",
    category: "Infrastructure",
    description: "Proxy et passerelle réseau",
    icon: "network",
    ...cncf("envoy"),
  },
  {
    id: "helm",
    name: "Helm",
    category: "Infrastructure",
    description: "Déploiement d’applications Kubernetes",
    icon: "app",
    ...cncf("helm"),
  },
  {
    id: "argo",
    name: "Argo",
    category: "Infrastructure",
    description: "Workflows et livraison GitOps",
    icon: "app",
    ...cncf("argo"),
  },
  {
    id: "keycloak",
    name: "Keycloak",
    category: "Sécurité",
    description: "Identité, authentification et SSO",
    icon: "shield",
    ...cncf("keycloak"),
  },
  {
    id: "prometheus",
    name: "Prometheus",
    category: "Observabilité",
    description: "Collecte de métriques et alertes",
    icon: "monitor",
    ...cncf("prometheus"),
  },
  {
    id: "opentelemetry",
    name: "OpenTelemetry",
    category: "Observabilité",
    description: "Traces, métriques et journaux",
    icon: "monitor",
    ...cncf("opentelemetry"),
  },
  {
    id: "grafana",
    name: "Grafana",
    category: "Observabilité",
    description: "Tableaux de bord et visualisation",
    icon: "monitor",
    logo: "/iris/logos/grafana.svg",
    source:
      "https://github.com/grafana/grafana/blob/main/public/img/grafana_icon.svg",
  },
];
export const serviceDefinition = (id: string) =>
  catalog.find((item) => item.id === id) ?? catalog[0]!;
