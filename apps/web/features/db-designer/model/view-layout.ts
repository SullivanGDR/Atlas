import type { Schema } from "./schema";

export type ConceptualPort = {
  id: string;
  side: "left" | "right" | "top" | "bottom";
  offset: number;
};

// Read-only projections have their own arrangement; the editable project stays intact.
export function arrangeProjection(schema: Schema): Schema {
  const columns = Math.max(1, Math.ceil(Math.sqrt(schema.entities.length)));
  let y = 0;
  const entities = schema.entities.map((entity) => ({
    ...entity,
    position: { ...entity.position },
  }));
  for (let start = 0; start < entities.length; start += columns) {
    const row = entities.slice(start, start + columns);
    row.forEach((entity, column) => {
      entity.position = { x: column * 480, y };
    });
    y +=
      Math.max(...row.map((entity) => 90 + entity.attributes.length * 40)) + 80;
  }
  return { ...schema, entities };
}

export function conceptualConnections(schema: Schema) {
  const entities = new Map(
    schema.entities.map((entity) => [entity.id, entity]),
  );
  const ports: Record<string, ConceptualPort[]> = Object.fromEntries(
    schema.entities.map((entity) => [entity.id, []]),
  );
  const handles: Record<string, { source: string; target: string }> = {};
  const peers = new Map<string, { x: number; y: number }>();
  for (const relation of schema.relations) {
    const source = entities.get(relation.sourceEntityId),
      target = entities.get(relation.targetEntityId);
    if (!source || !target) continue;
    const vertical =
      source !== target && source.position.x === target.position.x;
    const forward = target.position.x > source.position.x;
    const downward = target.position.y > source.position.y;
    const sourceSide =
      source === target
        ? "right"
        : vertical
          ? downward
            ? "bottom"
            : "top"
          : forward
            ? "right"
            : "left";
    const targetSide =
      source === target
        ? "bottom"
        : vertical
          ? downward
            ? "top"
            : "bottom"
          : forward
            ? "left"
            : "right";
    const sourceId = relation.id + ":source",
      targetId = relation.id + ":target";
    ports[source.id]!.push({ id: sourceId, side: sourceSide, offset: 50 });
    ports[target.id]!.push({ id: targetId, side: targetSide, offset: 50 });
    peers.set(sourceId, target.position);
    peers.set(targetId, source.position);
    handles[relation.id] = { source: sourceId, target: targetId };
  }
  for (const entity of schema.entities) {
    for (const side of ["left", "right", "top", "bottom"] as const) {
      const horizontalEdge = side === "top" || side === "bottom";
      const group = ports[entity.id]!.filter((port) => port.side === side).sort(
        (a, b) => {
          const first = peers.get(a.id)!,
            second = peers.get(b.id)!;
          return (
            (horizontalEdge ? first.x - second.x : first.y - second.y) ||
            a.id.localeCompare(b.id)
          );
        },
      );
      group.forEach((port, index) => {
        const fraction = (index + 1) / (group.length + 1);
        const height = 90 + entity.attributes.length * 40;
        port.offset = horizontalEdge
          ? fraction * 100
          : ((80 + (height - 80) * fraction) / height) * 100;
      });
    }
  }
  return { ports, handles };
}
