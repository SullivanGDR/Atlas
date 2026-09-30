import { getSmoothStepPath, Position } from "@xyflow/react";
import {
  absolutePosition,
  orderedNodes,
  type IrisProject,
  type MapNode,
  type MapLink,
} from "./model";
import { serviceDefinition } from "./catalog";

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
const short = (value: string, max = 25) =>
  escape(value.length > max ? `${value.slice(0, max - 1)}…` : value);
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function renderSvg(
  project: IrisProject,
  logos: Record<string, string> = {},
) {
  const nodes = orderedNodes(project.nodes).map((n) => ({
    ...n,
    position: absolutePosition(n, project.nodes),
  }));
  const minX = Math.min(0, ...nodes.map((n) => n.position.x));
  const minY = Math.min(0, ...nodes.map((n) => n.position.y));
  const maxX = Math.max(400, ...nodes.map((n) => n.position.x + n.width));
  const maxY = Math.max(200, ...nodes.map((n) => n.position.y + n.height));
  const width = Math.max(800, maxX - minX + 112);
  const height = maxY - minY + 208;
  const offsetX = (width - (maxX - minX)) / 2 - minX;
  const offsetY = 112 - minY;
  const at = (node: MapNode, side: MapLink["sourceSide"]) => ({
    x:
      node.position.x +
      (side === "left" ? 0 : side === "right" ? node.width : node.width / 2),
    y:
      node.position.y +
      (side === "top" ? 0 : side === "bottom" ? node.height : node.height / 2),
  });
  const positions = {
    left: Position.Left,
    right: Position.Right,
    top: Position.Top,
    bottom: Position.Bottom,
  };
  const zones = nodes
    .filter((n) => n.kind === "zone")
    .map(
      (n) =>
        `<g transform="translate(${n.position.x} ${n.position.y})"><rect width="${n.width}" height="${n.height}" rx="10" fill="#f6f6f5" stroke="#bcbcbc" stroke-dasharray="6 4"/><text x="18" y="29" font-size="14" font-weight="600">${short(n.name, Math.floor(n.width / 9) - 4)}</text><text x="18" y="48" font-size="10" fill="#666">${escape(n.environment)}</text></g>`,
    )
    .join("");
  const links = project.links
    .map((l) => {
      const source = nodes.find((n) => n.id === l.source),
        target = nodes.find((n) => n.id === l.target);
      if (!source || !target) return "";
      const a = at(source, l.sourceSide),
        b = at(target, l.targetSide);
      const [path, x, y] = getSmoothStepPath({
        sourceX: a.x,
        sourceY: a.y,
        targetX: b.x,
        targetY: b.y,
        sourcePosition: positions[l.sourceSide],
        targetPosition: positions[l.targetSide],
        borderRadius: 8,
        offset: 24,
      });
      const label = [l.name, l.protocol].filter(Boolean).join(" · ");
      const labelWidth = Math.min(label.length, 32) * 6 + 16;
      return `<path d="${path}" fill="none" stroke="#777" stroke-width="1.4" ${l.mode === "async" ? 'stroke-dasharray="6 5"' : ""} marker-end="url(#arrow)" ${l.direction === "both" ? 'marker-start="url(#arrow)"' : ""}/>${label ? `<rect x="${x - labelWidth / 2}" y="${y - 10}" width="${labelWidth}" height="20" rx="3" fill="#f0f0ef"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10">${short(label, 32)}</text>` : ""}`;
    })
    .join("");
  const services = nodes
    .filter((n) => n.kind === "service")
    .map((n) => {
      const logo = logos[n.service];
      const definition = serviceDefinition(n.service);
      return `<g transform="translate(${n.position.x} ${n.position.y})"><rect width="${n.width}" height="${n.height}" rx="8" fill="#fff" stroke="#c9c9c9"/><rect x="14" y="18" width="36" height="36" rx="6" fill="#f6f6f6"/>${logo ? `<image href="${escape(logo)}" x="18" y="22" width="28" height="28"/>` : `<text x="32" y="42" text-anchor="middle" font-size="17" font-weight="600">${escape(definition.name[0] ?? "S")}</text>`}<text x="62" y="32" font-size="13" font-weight="600">${short(n.name, 21)}</text><text x="62" y="51" font-size="10" fill="#666">${short(n.technology || definition.name, 25)}</text><path d="M0 72H${n.width}" stroke="#e5e5e5"/><text x="14" y="92" font-size="10" fill="#666">${short(n.environment === "Non précisé" ? definition.category : n.environment, 24)}</text><text x="${n.width - 12}" y="92" text-anchor="end" font-size="10" fill="#666">${short(n.criticality === "Standard" ? n.owner : n.criticality, 12)}</text></g>`;
    })
    .join("");
  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#777"/></marker></defs><rect width="100%" height="100%" fill="#f0f0ef"/><g font-family="Arial, sans-serif" fill="#292929"><text x="${width / 2}" y="44" text-anchor="middle" font-size="23" font-weight="600">${short(`SI — ${project.name}`, Math.floor(width / 14) - 4)}</text><text x="${width / 2}" y="68" text-anchor="middle" font-size="11" fill="#666">Cartographie des services et des flux</text><g transform="translate(${offsetX} ${offsetY})">${zones}${links}${services}</g><path d="M40 ${height - 48}H${width - 40}" stroke="#d5d5d5"/><text x="40" y="${height - 25}" font-size="11" fill="#666">${nodes.filter((n) => n.kind === "service").length} services · ${project.links.length} flux · Pointillés : asynchrone</text><text x="${width - 40}" y="${height - 25}" text-anchor="end" font-size="11" fill="#666">Made on Atlas by Iris</text></g></svg>`,
  };
}
export async function exportImage(project: IrisProject, format: "svg" | "png") {
  const logos: Record<string, string> = {};
  await Promise.all(
    [...new Set(project.nodes.map((n) => n.service))].map(async (id) => {
      const path = serviceDefinition(id).logo;
      if (!path) return;
      const response = await fetch(path);
      if (!response.ok) throw new Error("Logo indisponible");
      const data = await response.text();
      logos[id] =
        `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data)))}`;
    }),
  );
  const { svg, width, height } = renderSvg(project, logos);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  if (format === "svg") {
    download(blob, `${project.name}.svg`);
    return;
  }
  const scale = Math.min(
    2,
    8192 / width,
    8192 / height,
    Math.sqrt(24_000_000 / (width * height)),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible");
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Conversion impossible"))),
        "image/png",
      ),
    );
    download(png, `${project.name}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
