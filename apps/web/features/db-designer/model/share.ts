import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import { parseProject, serializeProject, type Schema } from "./schema";

const MAX_RAW = 100_000;
export function encodeShare(schema: Schema) {
  const raw = strToU8(serializeProject(schema));
  if (raw.length > MAX_RAW)
    throw new Error(
      "Ce schéma est trop grand pour un lien. Partagez son fichier .atlas.json.",
    );
  const compressed = deflateSync(raw);
  const token = btoa(String.fromCharCode(...compressed))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  if (token.length > 12_000)
    throw new Error(
      "Ce schéma est trop grand pour un lien. Partagez son fichier .atlas.json.",
    );
  return raw.length + "." + token;
}
export function decodeShare(token: string): Schema {
  const [size, content, extra] = token.split(".");
  const length = Number(size);
  if (
    extra ||
    !content ||
    content.length > 12_000 ||
    !/^[A-Za-z0-9_-]+$/.test(content) ||
    !Number.isInteger(length) ||
    length < 1 ||
    length > MAX_RAW
  )
    throw new Error("Lien de partage invalide.");
  const compressed = Uint8Array.from(
    atob(content.replaceAll("-", "+").replaceAll("_", "/")),
    (c) => c.charCodeAt(0),
  );
  const raw = inflateSync(compressed, { out: new Uint8Array(length) });
  return parseProject(JSON.parse(strFromU8(raw)));
}
