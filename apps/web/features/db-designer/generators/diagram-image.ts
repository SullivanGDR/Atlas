import type { Attribute, Entity, Schema } from "../model/schema";
import { mcdToMld } from "../transforms/mcd-to-mld";

export type DiagramModel = "mcd" | "mld" | "erd";
export type ImageFormat = "png" | "svg";
export interface ImagePalette {
  paper: string;
  ink: string;
  muted: string;
  line: string;
  header: string;
}
export const diagramModels = [
  {
    id: "mcd",
    label: "MCD",
    description: "Entités, attributs et associations.",
  },
  {
    id: "mld",
    label: "MLD",
    description: "Tables, clés étrangères et jointures.",
  },
  {
    id: "erd",
    label: "ERD",
    description: "Tables et relations du schéma de travail.",
  },
] as const;

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const lines = (value: string, limit: number) => {
  const chars = Array.from(value || "Sans nom");
  const result: string[] = [];
  while (chars.length) result.push(chars.splice(0, limit).join(""));
  return result;
};
const typeLabel = (a: Attribute) =>
  a.type === "VARCHAR" && a.length
    ? `VARCHAR(${a.length})`
    : a.type === "NUMERIC" && a.precision
      ? `NUMERIC(${a.precision}${a.scale === undefined ? "" : "," + a.scale})`
      : a.type;

export function projectDiagram(schema: Schema, model: DiagramModel): Schema {
  if (model === "mld") return mcdToMld(schema);
  const result = structuredClone(schema);
  if (model === "mcd") {
    for (const entity of result.entities) {
      const foreign = new Set(
        result.relations
          .filter(
            (r) => r.targetEntityId === entity.id && r.cardinality !== "N-N",
          )
          .flatMap(
            (r) =>
              r.columnPairs?.map((p) => p.targetColumnId) ?? [r.targetColumnId],
          ),
      );
      entity.attributes = entity.attributes.filter(
        (a) => a.isPrimaryKey || !foreign.has(a.id),
      );
    }
  }
  return result;
}

type Box = {
  entity: Entity;
  x: number;
  y: number;
  width: number;
  height: number;
  headerHeight: number;
  rows: { a: Attribute; y: number; height: number; name: string[] }[];
};

type Point = { x: number; y: number };
function roundedPath(points: Point[]) {
  const route = points.filter(
    (p, i) => !i || p.x !== points[i - 1]!.x || p.y !== points[i - 1]!.y,
  );
  let path = `M${route[0]!.x} ${route[0]!.y}`;
  for (let i = 1; i < route.length - 1; i++) {
    const previous = route[i - 1]!,
      corner = route[i]!,
      next = route[i + 1]!;
    const before = Math.hypot(corner.x - previous.x, corner.y - previous.y);
    const after = Math.hypot(next.x - corner.x, next.y - corner.y);
    const radius = Math.min(10, before / 2, after / 2);
    const start = {
      x: corner.x + ((previous.x - corner.x) * radius) / before,
      y: corner.y + ((previous.y - corner.y) * radius) / before,
    };
    const end = {
      x: corner.x + ((next.x - corner.x) * radius) / after,
      y: corner.y + ((next.y - corner.y) * radius) / after,
    };
    path += ` L${start.x} ${start.y} Q${corner.x} ${corner.y} ${end.x} ${end.y}`;
  }
  const last = route[route.length - 1]!;
  return path + ` L${last.x} ${last.y}`;
}

/** Native SVG: independent of the viewport, HTML controls and the editor theme. */
export function renderDiagramImage(
  schema: Schema,
  model: DiagramModel,
  palette: ImagePalette,
) {
  const graph = projectDiagram(schema, model);
  if (!graph.entities.length)
    throw new Error("Ajoutez une table avant d’exporter une image.");
  const columnCount = Math.min(4, Math.ceil(Math.sqrt(schema.entities.length)));
  const boxWidth = 380,
    gapX = 220,
    gapY = 130,
    margin = 64;
  const boxes: Box[] = graph.entities.map((entity) => {
    const headerHeight = 30 + lines(entity.name, 17).length * 22;
    let y = headerHeight + 12;
    const rows = entity.attributes.map((a) => {
      const name = lines(a.name, 18);
      const height = Math.max(42, name.length * 23 + 16);
      const row = { a, y, height, name };
      y += height;
      return row;
    });
    return {
      entity,
      x: 0,
      y: 0,
      width: boxWidth,
      height: y + 14,
      headerHeight,
      rows,
    };
  });
  let diagramHeight = 0;
  for (let i = 0; i < boxes.length; i += columnCount) {
    const row = boxes.slice(i, i + columnCount);
    const rowHeight = Math.max(...row.map((b) => b.height));
    row.forEach((box, col) => {
      box.x = col * (boxWidth + gapX);
      box.y = diagramHeight;
    });
    diagramHeight += rowHeight + (i + columnCount < boxes.length ? gapY : 0);
  }
  const diagramWidth = columnCount * boxWidth + (columnCount - 1) * gapX;
  let minX = 0,
    minY = 0,
    maxX = diagramWidth,
    maxY = diagramHeight;
  const byId = new Map(boxes.map((b) => [b.entity.id, b]));
  const text = (x: number, y: number, value: string, size = 13, options = "") =>
    `<text x="${x}" y="${y}" font-size="${size}" ${options}>${escape(value)}</text>`;
  const muted = `fill="${palette.muted}"`;
  const connections: string[] = [];
  const relationLabels: string[] = [];
  const side = (box: Box, other: Box) => (other.x >= box.x ? "right" : "left");
  const conceptualPort = (box: Box, other: Box, relationId: string) => {
    const peers = graph.relations
      .flatMap((relation) => {
        const peerId =
          relation.sourceEntityId === box.entity.id
            ? relation.targetEntityId
            : relation.targetEntityId === box.entity.id
              ? relation.sourceEntityId
              : null;
        const peer = peerId ? byId.get(peerId) : undefined;
        return peer && side(box, peer) === side(box, other)
          ? [{ id: relation.id, y: peer.y, x: peer.x }]
          : [];
      })
      .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
    const rank = peers.findIndex((peer) => peer.id === relationId);
    return (
      box.y +
      box.headerHeight +
      ((box.height - box.headerHeight) * (rank + 1)) / (peers.length + 1)
    );
  };
  graph.relations.forEach((r, index) => {
    const source = byId.get(r.sourceEntityId),
      target = byId.get(r.targetEntityId);
    if (!source || !target) return;
    const rowY = (box: Box, other: Box, id: string) => {
      if (model === "mcd") return conceptualPort(box, other, r.id);
      const row = box.rows.find((row) => row.a.id === id);
      return !row
        ? box.y + box.headerHeight / 2
        : box.y + row.y + row.height / 2;
    };
    const sy = rowY(source, target, r.sourceColumnId),
      ty = rowY(target, source, r.targetColumnId);
    const forward = target.x > source.x;
    const sameColumn = source.x === target.x;
    const sx = source.x + (forward || sameColumn ? boxWidth : 0);
    const tx = target.x + (forward ? 0 : boxWidth);
    const lane = (index % 4) * 16;
    let route: Point[], lx: number, ly: number;
    if (source === target) {
      lx = sx + 38 + lane;
      ly = sy - 30;
      route = [
        { x: sx, y: sy },
        { x: lx, y: sy },
        { x: lx, y: source.y - 30 },
        { x: source.x + boxWidth / 2, y: source.y - 30 },
        { x: source.x + boxWidth / 2, y: source.y },
      ];
      ly = source.y - 38;
    } else if (
      sameColumn &&
      model === "mcd" &&
      !boxes.some(
        (box) =>
          box !== source &&
          box !== target &&
          box.x === source.x &&
          box.y > Math.min(source.y, target.y) &&
          box.y < Math.max(source.y, target.y),
      )
    ) {
      // Facing borders avoid the unnecessary loop around vertically adjacent entities.
      const downward = target.y > source.y;
      const start = {
        x: source.x + boxWidth / 2,
        y: source.y + (downward ? source.height : 0),
      };
      const end = {
        x: target.x + boxWidth / 2,
        y: target.y + (downward ? 0 : target.height),
      };
      route = [start, end];
      lx = start.x;
      ly = (start.y + end.y) / 2;
    } else if (sameColumn) {
      lx = sx + 48 + lane;
      ly = (sy + ty) / 2;
      route = [
        { x: sx, y: sy },
        { x: lx, y: sy },
        { x: lx, y: ty },
        { x: tx, y: ty },
      ];
    } else {
      lx = (sx + tx) / 2 + lane - 24;
      ly = (sy + ty) / 2;
      route = [
        { x: sx, y: sy },
        { x: lx, y: sy },
        { x: lx, y: ty },
        { x: tx, y: ty },
      ];
    }
    connections.push(
      `<path data-relation="${escape(r.id)}" d="${roundedPath(route)}" fill="none" stroke="${palette.muted}" stroke-width="1.4" stroke-linejoin="round"/>`,
    );
    const label = r.cardinality.replace("-", " : ");
    minX = Math.min(minX, lx - 30);
    maxX = Math.max(maxX, lx + 30);
    minY = Math.min(minY, ly - 13);
    maxY = Math.max(maxY, ly + 13);
    if (model === "mcd") {
      const cardinalities = r.cardinality.split("-");
      const endpoint = (point: Point, neighbor: Point, value: string) => {
        const horizontal = point.y === neighbor.y;
        const x = horizontal
          ? point.x + Math.sign(neighbor.x - point.x) * 22
          : point.x + 14;
        const y = horizontal
          ? point.y - 10
          : point.y + Math.sign(neighbor.y - point.y) * 22 + 5;
        return text(
          x,
          y,
          value,
          15,
          `font-weight="600" text-anchor="${horizontal ? "middle" : "start"}" paint-order="stroke" stroke="${palette.paper}" stroke-width="5" stroke-linejoin="round"`,
        );
      };
      relationLabels.push(
        endpoint(route[0]!, route[1]!, cardinalities[0]!),
        endpoint(route.at(-1)!, route.at(-2)!, cardinalities[1]!),
      );
    } else {
      relationLabels.push(
        `<rect x="${lx - 29}" y="${ly - 12}" width="58" height="24" rx="4" fill="${palette.paper}" stroke="${palette.line}"/>${text(lx, ly + 4, label, 13, 'text-anchor="middle"')}`,
      );
    }
    if (r.name?.trim()) {
      const name = lines(r.name, 18);
      minX = Math.min(minX, lx - 76);
      maxX = Math.max(maxX, lx + 76);
      maxY = Math.max(maxY, ly + 25 + name.length * 15);
      relationLabels.push(
        `<rect x="${lx - 76}" y="${ly + 17}" width="152" height="${name.length * 15 + 8}" rx="3" fill="${palette.paper}"/>`,
      );
      name.forEach((line, i) =>
        relationLabels.push(
          text(lx, ly + 31 + i * 15, line, 11, 'text-anchor="middle"'),
        ),
      );
    }
  });
  const contentWidth = maxX - minX,
    contentHeight = maxY - minY;
  const width = Math.max(1080, contentWidth + margin * 2);
  const titleLines = lines(
    model.toUpperCase() + " — " + (schema.name.trim() || "Sans titre"),
    Math.floor((width - 2 * margin) / 30),
  );
  const headerHeight = 68 + titleLines.length * 40;
  const height = Math.max(560, headerHeight + contentHeight + 208);
  const offsetX = (width - contentWidth) / 2 - minX;
  const offsetY =
    headerHeight + (height - headerHeight - 80 - contentHeight) / 2 - minY;
  const tables = boxes.map((box) => {
    const foreign = new Set(
      graph.relations
        .filter(
          (r) => r.targetEntityId === box.entity.id && r.cardinality !== "N-N",
        )
        .flatMap(
          (r) =>
            r.columnPairs?.map((p) => p.targetColumnId) ?? [r.targetColumnId],
        ),
    );
    const content = [
      `<rect width="${boxWidth}" height="${box.height}" rx="6" fill="${palette.paper}" stroke="${palette.line}"/>`,
      `<path d="M6 0 H${boxWidth - 6} Q${boxWidth} 0 ${boxWidth} 6 V${box.headerHeight} H0 V6 Q0 0 6 0 Z" fill="${palette.header}"/>`,
      `<path d="M0 ${box.headerHeight} H${boxWidth}" stroke="${palette.line}"/>`,
      ...lines(box.entity.name, 17).map((line, i) =>
        text(20, 31 + i * 22, line, 20, 'font-weight="600"'),
      ),
    ];
    for (const row of box.rows) {
      const key = [
        row.a.isPrimaryKey ? (model === "mcd" ? "ID" : "PK") : "",
        model !== "mcd" && foreign.has(row.a.id) ? "FK" : "",
      ]
        .filter(Boolean)
        .join("/");
      content.push(text(16, row.y + 27, key, 13, 'font-weight="600"'));
      row.name.forEach((line, i) =>
        content.push(
          text(61, row.y + 27 + i * 23, line, 17, 'font-family="monospace"'),
        ),
      );
      if (model !== "mcd")
        content.push(
          text(
            boxWidth - 16,
            row.y + 27,
            typeLabel(row.a),
            13,
            `text-anchor="end" ${muted}`,
          ),
        );
    }
    return `<g transform="translate(${box.x} ${box.y})">${content.join("")}</g>`;
  });
  const title = titleLines
    .map((line, i) =>
      text(
        width / 2,
        58 + i * 40,
        line,
        30,
        'text-anchor="middle" font-weight="600"',
      ),
    )
    .join("");
  const legendItem = (x: number, key: string, label: string) =>
    `<g transform="translate(${x} ${height - 48})"><rect width="30" height="22" rx="4" fill="${palette.header}"/>${text(15, 15, key, 11, 'text-anchor="middle" font-weight="600"')}${text(40, 15, label, 13, muted)}</g>`;
  const legend =
    model === "mcd"
      ? legendItem(margin, "ID", "Identifiant")
      : legendItem(margin, "PK", "Clé primaire") +
        legendItem(margin + 170, "FK", "Clé étrangère");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
    <title>${escape(model.toUpperCase() + " — " + schema.name)}</title>
    <desc>${escape(diagramModels.find((m) => m.id === model)!.description)}</desc>
    <rect width="${width}" height="${height}" fill="${palette.paper}"/>
    <g fill="${palette.ink}" font-family="Arial, Helvetica, sans-serif">
      ${title}
      <path d="M${margin} ${headerHeight} H${width - margin}" stroke="${palette.line}"/>
      <g transform="translate(${offsetX} ${offsetY})">${connections.join("")}${tables.join("")}${relationLabels.join("")}</g>
      <path d="M${margin} ${height - 80} H${width - margin}" stroke="${palette.line}"/>
      ${legend}
      ${text(width - margin, height - 33, "Made on Atlas by Athena", 13, `text-anchor="end" ${muted}`)}
    </g>
  </svg>`;
  return {
    svg,
    width,
    height,
    tableCount: boxes.length,
    layout: boxes.map(({ entity, x, y, width, height }) => ({
      id: entity.id,
      x,
      y,
      width,
      height,
    })),
    contentBounds: {
      x: offsetX + minX,
      y: offsetY + minY,
      width: contentWidth,
      height: contentHeight,
    },
  };
}

export async function diagramImageBlob(
  document: ReturnType<typeof renderDiagramImage>,
  format: ImageFormat,
): Promise<Blob> {
  const svg = new Blob([document.svg], { type: "image/svg+xml;charset=utf-8" });
  if (format === "svg") return svg;
  const url = URL.createObjectURL(svg);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(
      2,
      8192 / document.width,
      8192 / document.height,
      Math.sqrt(24_000_000 / (document.width * document.height)),
    );
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(document.width * scale));
    canvas.height = Math.max(1, Math.round(document.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Votre navigateur ne peut pas créer cette image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(
                new Error("Impossible de créer le PNG. Essayez le format SVG."),
              ),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
