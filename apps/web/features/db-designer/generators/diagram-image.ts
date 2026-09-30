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

/** Native SVG: independent of the viewport, HTML controls and the editor theme. */
export function renderDiagramImage(
  schema: Schema,
  model: DiagramModel,
  palette: ImagePalette,
) {
  const graph = projectDiagram(schema, model);
  if (!graph.entities.length)
    throw new Error("Ajoutez une table avant d’exporter une image.");
  const columnCount = Math.min(4, Math.ceil(Math.sqrt(graph.entities.length)));
  const boxWidth = 380,
    gapX = 190,
    gapY = 130,
    margin = 64;
  const boxes: Box[] = graph.entities.map((entity) => {
    const headerHeight = 30 + lines(entity.name, 20).length * 22;
    let y = headerHeight + 12;
    const rows = entity.attributes.map((a) => {
      const name = lines(a.name, model === "mcd" ? 34 : 21);
      const height = Math.max(34, name.length * 18 + 14);
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
      box.y = diagramHeight + (rowHeight - box.height) / 2;
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
  graph.relations.forEach((r, index) => {
    const source = byId.get(r.sourceEntityId),
      target = byId.get(r.targetEntityId);
    if (!source || !target) return;
    const rowY = (box: Box, id: string) => {
      const row = box.rows.find((row) => row.a.id === id);
      return model === "mcd" || !row
        ? box.y + box.headerHeight / 2
        : box.y + row.y + row.height / 2;
    };
    const sy = rowY(source, r.sourceColumnId),
      ty = rowY(target, r.targetColumnId);
    const forward = target.x > source.x;
    const sameColumn = source.x === target.x;
    const sx = source.x + (forward || sameColumn ? boxWidth : 0);
    const tx = target.x + (forward ? 0 : boxWidth);
    const lane = (index % 5) * 8;
    let path: string, lx: number, ly: number;
    if (source === target) {
      lx = sx + 38 + lane;
      ly = sy - 30;
      path = `M${sx} ${sy} H${lx} V${source.y - 30} H${source.x + boxWidth / 2} V${source.y}`;
      ly = source.y - 38;
    } else if (sameColumn) {
      lx = sx + 48 + lane;
      ly = (sy + ty) / 2;
      path = `M${sx} ${sy} H${lx} V${ty} H${tx}`;
    } else {
      lx = (sx + tx) / 2 + lane;
      ly = (sy + ty) / 2;
      path = `M${sx} ${sy} H${lx} V${ty} H${tx}`;
    }
    connections.push(
      `<path d="${path}" fill="none" stroke="${palette.muted}" stroke-width="1.4" stroke-linejoin="round"/>`,
    );
    const label = r.cardinality.replace("-", " : ");
    minX = Math.min(minX, lx - 30);
    maxX = Math.max(maxX, lx + 30);
    minY = Math.min(minY, ly - 13);
    maxY = Math.max(maxY, ly + 13);
    relationLabels.push(
      `<rect x="${lx - 29}" y="${ly - 12}" width="58" height="24" rx="4" fill="${palette.paper}" stroke="${palette.line}"/>${text(lx, ly + 4, label, 11, 'text-anchor="middle"')}`,
    );
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
  const height = Math.max(560, headerHeight + contentHeight + 192);
  const offsetX = (width - contentWidth) / 2 - minX;
  const offsetY =
    headerHeight + (height - headerHeight - 64 - contentHeight) / 2 - minY;
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
      ...lines(box.entity.name, 20).map((line, i) =>
        text(20, 31 + i * 22, line, 17, 'font-weight="600"'),
      ),
    ];
    for (const row of box.rows) {
      const key = [
        row.a.isPrimaryKey ? (model === "mcd" ? "ID" : "PK") : "",
        model !== "mcd" && foreign.has(row.a.id) ? "FK" : "",
      ]
        .filter(Boolean)
        .join("/");
      content.push(text(16, row.y + 22, key, 10, muted));
      row.name.forEach((line, i) =>
        content.push(
          text(61, row.y + 22 + i * 18, line, 13, 'font-family="monospace"'),
        ),
      );
      if (model !== "mcd")
        content.push(
          text(
            boxWidth - 16,
            row.y + 22,
            typeLabel(row.a),
            11,
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
  const legend =
    model === "mcd"
      ? "ID · Identifiant"
      : "PK · Clé primaire    FK · Clé étrangère";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
    <title>${escape(model.toUpperCase() + " — " + schema.name)}</title>
    <desc>${escape(diagramModels.find((m) => m.id === model)!.description)}</desc>
    <rect width="${width}" height="${height}" fill="${palette.paper}"/>
    <g fill="${palette.ink}" font-family="Arial, Helvetica, sans-serif">
      ${title}
      <path d="M${margin} ${headerHeight} H${width - margin}" stroke="${palette.line}"/>
      <g transform="translate(${offsetX} ${offsetY})">${connections.join("")}${tables.join("")}${relationLabels.join("")}</g>
      <path d="M${margin} ${height - 64} H${width - margin}" stroke="${palette.line}"/>
      ${text(margin, height - 32, legend, 11, muted)}
      ${text(width - margin, height - 32, "Made on Atlas by Athena", 12, `text-anchor="end" ${muted}`)}
    </g>
  </svg>`;
  return {
    svg,
    width,
    height,
    tableCount: boxes.length,
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
