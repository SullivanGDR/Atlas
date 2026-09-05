import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../../../", import.meta.url);
const source = fileURLToPath(new URL("design/atlas-source.png", root));
const output = new URL("../public/brand/", import.meta.url);
await mkdir(output, { recursive: true });
const variants = [
  [96, new URL("atlas-mark.png", output)],
  [192, new URL("atlas-icon-192.png", output)],
  [512, new URL("atlas-icon-512.png", output)],
  [48, new URL("../app/icon.png", import.meta.url)],
  [180, new URL("../app/apple-icon.png", import.meta.url)],
];
for (const [size, destination] of variants) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(destination));
}
// ICO supports PNG payloads. Include both standard browser sizes.
const sizes = [16, 32];
const images = await Promise.all(
  sizes.map((size) =>
    sharp(source).resize(size, size).ensureAlpha().png().toBuffer(),
  ),
);
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(
  new URL("../app/favicon.ico", import.meta.url),
  Buffer.concat([header, ...images]),
);
console.log(
  "Atlas icons generated: header, favicon, browser, Apple and manifest.",
);
