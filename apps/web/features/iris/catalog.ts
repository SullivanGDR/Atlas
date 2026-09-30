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
export const categories = [
  "Frontend",
  "Frameworks backend",
  "Bases de données",
  "Cache",
  "Messagerie",
  "Infrastructure",
  "Réseau",
  "Sécurité",
  "Observabilité",
  "Stockage",
  "Générique",
] as const;
function technology(
  id: string,
  name: string,
  category: string,
  description: string,
  icon: ServiceDefinition["icon"] = "app",
): ServiceDefinition {
  return {
    id,
    name,
    category,
    description,
    icon,
    logo: `/iris/logos/${id}.svg`,
    source: `https://github.com/devicons/devicon/tree/master/icons/${id}`,
  };
}
export const catalog: ServiceDefinition[] = [
  technology(
    "react",
    "React",
    "Frontend",
    "Bibliothèque d’interfaces JavaScript",
  ),
  technology(
    "nextjs",
    "Next.js",
    "Frontend",
    "Framework React · rendu serveur et full-stack",
  ),
  technology(
    "nuxtjs",
    "Nuxt",
    "Frontend",
    "Framework Vue · rendu serveur et full-stack",
  ),
  technology("angular", "Angular", "Frontend", "Framework web TypeScript"),
  technology(
    "vuejs",
    "Vue.js",
    "Frontend",
    "Framework progressif d’interfaces web",
  ),
  technology(
    "svelte",
    "Svelte",
    "Frontend",
    "Interfaces compilées en JavaScript",
  ),
  technology(
    "fastapi",
    "FastAPI",
    "Frameworks backend",
    "Python · API asynchrones",
    "server",
  ),
  technology(
    "django",
    "Django",
    "Frameworks backend",
    "Python · applications web",
    "server",
  ),
  technology(
    "spring",
    "Spring",
    "Frameworks backend",
    "Java · services et applications",
    "server",
  ),
  technology(
    "nestjs",
    "NestJS",
    "Frameworks backend",
    "Node.js / TypeScript · API modulaires",
    "server",
  ),
  technology(
    "laravel",
    "Laravel",
    "Frameworks backend",
    "PHP · applications web et API",
    "server",
  ),
  technology(
    "express",
    "Express",
    "Frameworks backend",
    "Node.js · serveur HTTP et API",
    "server",
  ),
  technology(
    "mysql",
    "MySQL",
    "Bases de données",
    "SQL · base relationnelle",
    "database",
  ),
  technology(
    "mariadb",
    "MariaDB",
    "Bases de données",
    "SQL · base relationnelle",
    "database",
  ),
  technology(
    "mongodb",
    "MongoDB",
    "Bases de données",
    "NoSQL · documents JSON / BSON",
    "database",
  ),
  technology(
    "sqlite",
    "SQLite",
    "Bases de données",
    "SQL · base embarquée dans un fichier",
    "database",
  ),
  technology(
    "redis",
    "Redis",
    "Cache",
    "Clé-valeur en mémoire · cache et données",
    "database",
  ),
  technology(
    "rabbitmq",
    "RabbitMQ",
    "Messagerie",
    "Broker de messages · AMQP",
    "queue",
  ),
  technology(
    "apachekafka",
    "Apache Kafka",
    "Messagerie",
    "Streaming d’événements distribué",
    "queue",
  ),
  technology(
    "nodejs",
    "Node.js",
    "Infrastructure",
    "Runtime JavaScript côté serveur",
    "server",
  ),
  technology(
    "docker",
    "Docker",
    "Infrastructure",
    "Exécution et distribution de conteneurs",
    "cloud",
  ),
  technology(
    "nginx",
    "NGINX",
    "Réseau",
    "Serveur web, reverse proxy et load balancer",
    "network",
  ),
  {
    id: "application",
    name: "Application",
    category: "Générique",
    description: "Application métier ou service interne",
    icon: "app",
  },
  {
    id: "web",
    name: "Site web",
    category: "Générique",
    description: "Portail, frontend ou application web",
    icon: "app",
  },
  {
    id: "api",
    name: "API",
    category: "Générique",
    description: "API REST, GraphQL ou service backend",
    icon: "server",
  },
  {
    id: "saas",
    name: "Service SaaS",
    category: "Générique",
    description: "Application externe ou partenaire",
    icon: "cloud",
  },
  {
    id: "person",
    name: "Utilisateurs",
    category: "Générique",
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
    category: "Réseau",
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
    category: "Réseau",
    description: "Reverse proxy, routeur ou load balancer",
    icon: "network",
  },
  {
    id: "database",
    name: "Base de données",
    category: "Bases de données",
    description: "Stockage relationnel ou documentaire",
    icon: "database",
  },
  {
    id: "storage",
    name: "Stockage",
    category: "Stockage",
    description: "Fichiers, objets ou sauvegardes",
    icon: "database",
  },
  {
    id: "queue",
    name: "File de messages",
    category: "Messagerie",
    description: "Bus événementiel ou échanges asynchrones",
    icon: "queue",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "Bases de données",
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
    category: "Réseau",
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
  catalog.find((item) => item.id === id) ??
  catalog.find((item) => item.id === "application")!;

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.\s-]/g, "");
export function catalogGroups(query = "", category = "") {
  const search = normalize(query);
  return categories
    .filter((name) => !category || name === category)
    .map((name) => ({
      name,
      services: catalog.filter(
        (s) =>
          s.category === name &&
          normalize(
            `${s.id} ${s.name} ${s.description} ${s.category}`,
          ).includes(search),
      ),
    }))
    .filter((group) => group.services.length > 0);
}
