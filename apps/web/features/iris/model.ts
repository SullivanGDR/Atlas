import { z } from "zod";
import { catalog } from "./catalog";

export const SERVICE_WIDTH = 224;
export const SERVICE_HEIGHT = 104;
export const environments = [
  "Non précisé",
  "Production",
  "Préproduction",
  "Développement",
  "Externe",
] as const;
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w-]+$/);
const text = z.string().max(200);
const coordinate = z.number().finite().min(-100_000).max(100_000);
const nodeSchema = z.object({
  id,
  kind: z.enum(["service", "zone"]),
  service: z.string().refine((value) => catalog.some((s) => s.id === value)),
  name: text.min(1),
  description: z.string().max(2000),
  owner: text,
  technology: text,
  environment: z.enum(environments),
  criticality: z.enum(["Standard", "Important", "Critique"]),
  position: z.object({ x: coordinate, y: coordinate }),
  parentId: id.optional(),
  width: z.number().min(224).max(10000),
  height: z.number().min(104).max(10000),
});
const side = z.enum(["left", "right", "top", "bottom"]);
const linkSchema = z.object({
  id,
  source: id,
  target: id,
  sourceSide: side,
  targetSide: side,
  name: text,
  protocol: z.string().max(80),
  mode: z.enum(["sync", "async"]),
  direction: z.enum(["forward", "both"]),
  description: z.string().max(2000),
});
const projectSchema = z.object({
  name: text.min(1),
  nodes: z.array(nodeSchema).max(500),
  links: z.array(linkSchema).max(2000),
});
export type MapNode = z.infer<typeof nodeSchema>;
export type MapLink = z.infer<typeof linkSchema>;
export type IrisProject = z.infer<typeof projectSchema>;
export type Point = { x: number; y: number };

export function parseProject(value: unknown): IrisProject {
  const file = z
    .object({
      format: z.literal("atlas-iris"),
      version: z.literal(1),
      project: projectSchema,
    })
    .parse(value);
  const project = file.project;
  const ids = new Set<string>();
  for (const node of project.nodes) {
    if (ids.has(node.id))
      throw new Error("Deux éléments ont le même identifiant.");
    ids.add(node.id);
    if (node.kind === "service") {
      node.width = SERVICE_WIDTH;
      node.height = SERVICE_HEIGHT;
    }
    if (node.kind === "zone" && (node.width < 300 || node.height < 220))
      throw new Error("Une zone est trop petite.");
    const seen = new Set([node.id]);
    let parentId = node.parentId;
    while (parentId) {
      if (seen.has(parentId) || seen.size > 8)
        throw new Error("Les zones contiennent une boucle ou trop de niveaux.");
      seen.add(parentId);
      const parent = project.nodes.find((item) => item.id === parentId);
      if (!parent || parent.kind !== "zone")
        throw new Error("Zone parente introuvable.");
      parentId = parent.parentId;
    }
  }
  const linkIds = new Set<string>();
  for (const link of project.links) {
    if (linkIds.has(link.id))
      throw new Error("Deux flux ont le même identifiant.");
    linkIds.add(link.id);
    if (
      link.source === link.target ||
      ![link.source, link.target].every((id) =>
        project.nodes.some((node) => node.id === id && node.kind === "service"),
      )
    )
      throw new Error("Un flux doit relier deux services distincts.");
  }
  return project;
}
export function serializeProject(project: IrisProject) {
  const file = { format: "atlas-iris", version: 1, project };
  parseProject(file);
  return JSON.stringify(file, null, 2);
}
export function absolutePosition(node: MapNode, nodes: MapNode[]): Point {
  const point = { ...node.position };
  const seen = new Set([node.id]);
  let parentId = node.parentId;
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = nodes.find((item) => item.id === parentId);
    if (!parent) break;
    point.x += parent.position.x;
    point.y += parent.position.y;
    parentId = parent.parentId;
  }
  return point;
}
export function descendants(id: string, nodes: MapNode[]): Set<string> {
  const result = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes)
      if (node.parentId && result.has(node.parentId) && !result.has(node.id)) {
        result.add(node.id);
        changed = true;
      }
  }
  return result;
}
export function orderedNodes(nodes: MapNode[]): MapNode[] {
  const result: MapNode[] = [];
  const visited = new Set<string>();
  const add = (node: MapNode) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    const parent = nodes.find((n) => n.id === node.parentId);
    if (parent) add(parent);
    result.push(node);
  };
  nodes.forEach(add);
  return result;
}
export function reparent(project: IrisProject, id: string, parentId?: string) {
  const node = project.nodes.find((item) => item.id === id);
  if (!node) return;
  const blocked = descendants(id, project.nodes);
  const parent = project.nodes.find(
    (item) => item.id === parentId && item.kind === "zone",
  );
  if (parentId && (!parent || blocked.has(parentId)))
    throw new Error("Impossible d’imbriquer ces zones.");
  const position = absolutePosition(node, project.nodes);
  const origin = parent
    ? absolutePosition(parent, project.nodes)
    : { x: 0, y: 0 };
  node.position = { x: position.x - origin.x, y: position.y - origin.y };
  if (parent) {
    node.position.x = Math.max(24, node.position.x);
    node.position.y = Math.max(64, node.position.y);
    parent.width = Math.max(parent.width, node.position.x + node.width + 24);
    parent.height = Math.max(parent.height, node.position.y + node.height + 24);
  }
  node.parentId = parentId;
  // Growing an inner zone must also keep it inside its ancestors.
  let current = parent;
  while (current?.parentId) {
    const ancestor = project.nodes.find(
      (item) => item.id === current!.parentId,
    );
    if (!ancestor) break;
    ancestor.width = Math.max(
      ancestor.width,
      current.position.x + current.width + 24,
    );
    ancestor.height = Math.max(
      ancestor.height,
      current.position.y + current.height + 24,
    );
    current = ancestor;
  }
  parseProject({ format: "atlas-iris", version: 1, project });
}
export function groupAtDrop(project: IrisProject, id: string) {
  const node = project.nodes.find((item) => item.id === id);
  if (!node || node.kind !== "service") return;
  const pos = absolutePosition(node, project.nodes);
  const candidates = project.nodes
    .filter((item) => {
      if (item.kind !== "zone") return false;
      const at = absolutePosition(item, project.nodes);
      return (
        pos.x >= at.x + 12 &&
        pos.y >= at.y + 48 &&
        pos.x + node.width <= at.x + item.width - 12 &&
        pos.y + node.height <= at.y + item.height - 12
      );
    })
    .sort((a, b) => a.width * a.height - b.width * b.height);
  reparent(project, id, candidates[0]?.id);
}
export function removeNode(project: IrisProject, id: string) {
  // Removing a zone releases its contents without losing their positions or links.
  const node = project.nodes.find((item) => item.id === id);
  if (!node) return;
  for (const child of project.nodes.filter((item) => item.parentId === id))
    reparent(project, child.id, node.parentId);
  project.nodes = project.nodes.filter((item) => item.id !== id);
  project.links = project.links.filter(
    (link) => link.source !== id && link.target !== id,
  );
}
export function arrange(project: IrisProject) {
  const layout = (parentId?: string) => {
    const children = project.nodes.filter((node) => node.parentId === parentId);
    if (!parentId)
      children.sort(
        (a, b) => Number(a.kind === "zone") - Number(b.kind === "zone"),
      );
    children
      .filter((node) => node.kind === "zone")
      .forEach((node) => layout(node.id));
    const columns = Math.max(
      1,
      !parentId && children.length <= 4
        ? children.length
        : Math.ceil(Math.sqrt(children.length)),
    );
    let y = parentId ? 72 : 0;
    let maxWidth = 0;
    for (let index = 0; index < children.length; index += columns) {
      const row = children.slice(index, index + columns);
      let x = parentId ? 32 : 0;
      row.forEach((node) => {
        node.position = { x, y };
        x += node.width + 136;
      });
      maxWidth = Math.max(maxWidth, x - 136);
      y += Math.max(...row.map((node) => node.height)) + 80;
    }
    const parent = project.nodes.find((node) => node.id === parentId);
    if (parent) {
      parent.width = Math.max(300, maxWidth + 32);
      parent.height = Math.max(220, y - 80 + 32);
    }
  };
  layout();
}
export function makeNode(
  service: string,
  position: Point,
  kind: MapNode["kind"] = "service",
): MapNode {
  return {
    id: crypto.randomUUID(),
    service,
    kind,
    name:
      kind === "zone"
        ? "Nouvelle zone"
        : (catalog.find((s) => s.id === service)?.name ?? "Service"),
    position,
    width: kind === "zone" ? 560 : SERVICE_WIDTH,
    height: kind === "zone" ? 350 : SERVICE_HEIGHT,
    description: "",
    owner: "",
    technology: "",
    environment: "Non précisé",
    criticality: "Standard",
  };
}
export function exampleProject(): IrisProject {
  const node = (
    id: string,
    service: string,
    name: string,
    x: number,
    y: number,
    parentId?: string,
    kind: MapNode["kind"] = "service",
  ): MapNode => ({
    id,
    service,
    name,
    position: { x, y },
    parentId,
    kind,
    width: kind === "zone" ? 648 : SERVICE_WIDTH,
    height: kind === "zone" ? 380 : SERVICE_HEIGHT,
    description: "",
    owner: "",
    technology: "",
    environment: kind === "zone" ? "Production" : "Non précisé",
    criticality: "Standard",
  });
  const data = node(
    "data",
    "cloud",
    "Données privées",
    820,
    0,
    undefined,
    "zone",
  );
  data.width = 300;
  const link = (
    id: string,
    source: string,
    target: string,
    name: string,
    protocol: string,
    sourceSide: MapLink["sourceSide"] = "right",
    targetSide: MapLink["targetSide"] = "left",
  ): MapLink => ({
    id,
    source,
    target,
    name,
    protocol,
    sourceSide,
    targetSide,
    mode: "sync",
    direction: "forward",
    description: "",
  });
  return {
    name: "Architecture web",
    nodes: [
      node(
        "platform",
        "cloud",
        "Plateforme applicative",
        0,
        0,
        undefined,
        "zone",
      ),
      data,
      node("people", "person", "Utilisateurs", -310, 120),
      node("web", "web", "Portail web", 32, 80, "platform"),
      node("api", "api", "API métier", 392, 80, "platform"),
      node("identity", "keycloak", "Authentification", 32, 232, "platform"),
      node("metrics", "prometheus", "Supervision", 392, 232, "platform"),
      node("db", "postgresql", "Base métier", 38, 140, "data"),
    ],
    links: [
      link("access", "people", "web", "Accès", "HTTPS"),
      link("requests", "web", "api", "Requêtes", "REST"),
      link("sql", "api", "db", "Persistance", "TCP 5432"),
      link("sso", "web", "identity", "SSO", "OIDC", "bottom", "top"),
      link("monitor", "metrics", "api", "Métriques", "HTTP", "top", "bottom"),
    ],
  };
}
