import {
  Handle,
  NodeResizer,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  AppWindow,
  Server,
  Database,
  Cloud,
  Users,
  Network,
  Shield,
  Layers,
  Activity,
} from "lucide-react";
import { serviceDefinition } from "./catalog";
import type { MapNode } from "./model";
import { useIris } from "./store";
import Image from "next/image";

const icons = {
  app: AppWindow,
  server: Server,
  database: Database,
  cloud: Cloud,
  person: Users,
  network: Network,
  shield: Shield,
  queue: Layers,
  monitor: Activity,
};
export function ServiceIcon({ service }: { service: string }) {
  const definition = serviceDefinition(service);
  const Icon = icons[definition.icon];
  return definition.logo ? (
    <span className="iris-logo">
      <Image src={definition.logo} alt="" width={28} height={28} unoptimized />
    </span>
  ) : (
    <span className="iris-icon">
      <Icon size={23} strokeWidth={1.5} />
    </span>
  );
}
export type IrisFlowNode = Node<{ item: MapNode }, "service" | "zone">;
export function ServiceNode({ data, selected }: NodeProps<IrisFlowNode>) {
  const item = data.item;
  return (
    <div className={`iris-service ${selected ? "is-selected" : ""}`}>
      {Object.entries({
        left: Position.Left,
        right: Position.Right,
        top: Position.Top,
        bottom: Position.Bottom,
      }).map(([side, position]) => (
        <Handle
          key={side}
          type="source"
          id={side}
          position={position}
          aria-label={`Connexion ${side}`}
        />
      ))}
      <div className="iris-service-main">
        <ServiceIcon service={item.service} />
        <div>
          <strong title={item.name}>{item.name}</strong>
          <span>{item.technology || serviceDefinition(item.service).name}</span>
        </div>
      </div>
      <div className="iris-service-foot">
        <span>
          {item.environment === "Non précisé"
            ? serviceDefinition(item.service).category
            : item.environment}
        </span>
        <span>
          {item.criticality === "Standard" ? item.owner : item.criticality}
        </span>
      </div>
    </div>
  );
}
export function ZoneNode({ data, selected }: NodeProps<IrisFlowNode>) {
  const item = data.item;
  const nodes = useIris((s) => s.project.nodes);
  const children = nodes.filter((n) => n.parentId === item.id);
  const minWidth = Math.max(
    300,
    ...children.map((n) => n.position.x + n.width + 24),
  );
  const minHeight = Math.max(
    220,
    ...children.map((n) => n.position.y + n.height + 24),
  );
  return (
    <div className={`iris-zone ${selected ? "is-selected" : ""}`}>
      <NodeResizer
        isVisible={selected}
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={10000}
        maxHeight={10000}
        onResizeStart={() => useIris.getState().checkpoint()}
        onResize={(_, size) =>
          useIris.getState().edit((p) => {
            const n = p.nodes.find((n) => n.id === item.id)!;
            n.width = size.width;
            n.height = size.height;
            n.position = { x: size.x, y: size.y };
          }, false)
        }
      />
      <div className="iris-zone-title">
        <Layers size={15} />
        <strong>{item.name}</strong>
        <span>
          {item.environment === "Non précisé" ? "Zone" : item.environment}
        </span>
      </div>
    </div>
  );
}
export const nodeTypes = { service: ServiceNode, zone: ZoneNode };
