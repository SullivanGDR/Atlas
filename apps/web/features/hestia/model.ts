import { z } from "zod";

export type ThemeMode = "light" | "dark";
export type Scale = "compact" | "standard" | "airy";
export type Shadow = "none" | "soft" | "elevated";

export type PalettePreset = {
  id: string;
  name: string;
  description: string;
  swatches: [string, string, string, string, string];
  accent: string;
  darkAccent: string;
};

export const palettes: PalettePreset[] = [
  ...[
    [
      "ink",
      "Encre & papier",
      "Minimalisme éditorial, neutres chauds.",
      "#f5f4f0",
      "#ddd9d0",
      "#706b60",
      "#292722",
      "#292722",
      "#d9d6cc",
    ],
    [
      "ocean",
      "Océan profond",
      "Bleu franc pour les services et produits numériques.",
      "#f1f5fa",
      "#d2deed",
      "#566a84",
      "#17345c",
      "#245bb2",
      "#91b9f9",
    ],
    [
      "clay",
      "Terre cuite",
      "Chaleur artisanale et surfaces naturelles.",
      "#faf4ef",
      "#e8d7c9",
      "#81634e",
      "#4f3026",
      "#a34e35",
      "#edae91",
    ],
    [
      "amber",
      "Ambre & charbon",
      "Un accent solaire dans une structure sobre.",
      "#faf7ef",
      "#e7dfcb",
      "#786a4c",
      "#3c3322",
      "#a0640d",
      "#f0c16e",
    ],
    [
      "violet",
      "Iris électrique",
      "Une identité créative aux accents violets.",
      "#f5f3fb",
      "#ddd5ef",
      "#756584",
      "#35274c",
      "#7351b5",
      "#c1a4f4",
    ],
    [
      "rose",
      "Rose poudré",
      "Une palette douce pour les marques et contenus.",
      "#fbf3f5",
      "#ecd6dc",
      "#87616d",
      "#502e3a",
      "#b04468",
      "#eeabc1",
    ],
    [
      "teal",
      "Lagune",
      "Turquoise profond et surfaces froides.",
      "#eff7f7",
      "#cfe2e0",
      "#557574",
      "#214d4b",
      "#187e79",
      "#7ed7cc",
    ],
    [
      "mono",
      "Monochrome",
      "Gris purs, pour laisser le contenu parler.",
      "#f5f5f5",
      "#d9d9d9",
      "#686868",
      "#252525",
      "#303030",
      "#d5d5d5",
    ],
  ].map(
    ([id, name, description, bg, border, muted, ink, accent, darkAccent]) => ({
      id: id!,
      name: name!,
      description: description!,
      swatches: [
        bg!,
        "#ffffff",
        border!,
        muted!,
        ink!,
      ] as PalettePreset["swatches"],
      accent: accent!,
      darkAccent: darkAccent!,
    }),
  ),
  {
    id: "atlas",
    name: "Atlas graphite",
    description: "Neutre, précis et discret pour les produits de travail.",
    swatches: ["#f4f5f4", "#ffffff", "#d7dbd8", "#68736d", "#24332d"],
    accent: "#2f6f58",
    darkAccent: "#87c9aa",
  },
  {
    id: "mineral",
    name: "Brume minérale",
    description: "Bleu ardoise et blanc cassé pour une interface posée.",
    swatches: ["#f1f4f7", "#ffffff", "#d1d9e2", "#5e7185", "#274158"],
    accent: "#356b94",
    darkAccent: "#8fc3e6",
  },
  {
    id: "sage",
    name: "Sauge calme",
    description: "Une palette organique, lumineuse et facile à équilibrer.",
    swatches: ["#f2f5f0", "#ffffff", "#d4ded0", "#687b68", "#2f5036"],
    accent: "#4f7c59",
    darkAccent: "#9fd0a6",
  },
  {
    id: "plum",
    name: "Prune nocturne",
    description: "Une tonalité plus éditoriale avec un accent mesuré.",
    swatches: ["#f7f3f6", "#ffffff", "#e1d5df", "#80677b", "#4d2f47"],
    accent: "#865179",
    darkAccent: "#d2a6c6",
  },
];

export const typography = [
  {
    id: "plex",
    name: "Plex neutre",
    description: "Lecture nette, interface et documentation.",
    sans: '"IBM Plex Sans Variable", "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", Consolas, monospace',
  },
  {
    id: "system",
    name: "Système rapide",
    description: "La police native de chaque environnement.",
    sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: "ui-monospace, SFMono-Regular, Consolas, monospace",
  },
  {
    id: "editorial",
    name: "Éditorial doux",
    description: "Une hiérarchie plus expressive pour les contenus.",
    sans: 'Georgia, "Times New Roman", serif',
    mono: '"IBM Plex Mono", Consolas, monospace',
  },
] as const;

export type TypographyId = (typeof typography)[number]["id"];

const colorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);
export const tokenKeys = [
  "background",
  "surface",
  "foreground",
  "muted",
  "border",
  "brand",
  "brandForeground",
  "focus",
  "success",
  "warning",
  "danger",
] as const;
export type TokenKey = (typeof tokenKeys)[number];
const overridesSchema = z.partialRecord(z.enum(tokenKeys), colorSchema);

export const hestiaSchema = z.object({
  format: z.literal("atlas-hestia"),
  version: z.union([z.literal(1), z.literal(2)]),
  project: z.object({
    name: z.string().min(1).max(120),
    palette: z.string().refine((id) => palettes.some((p) => p.id === id)),
    customAccent: z.string().regex(/^#[0-9a-f]{6}$/i),
    typography: z.enum(["plex", "system", "editorial"]),
    scale: z.enum(["compact", "standard", "airy"]),
    radius: z.number().int().min(0).max(24),
    shadow: z.enum(["none", "soft", "elevated"]),
    mode: z.enum(["light", "dark"]),
    style: z
      .enum(["minimal", "editorial", "product", "brutalist", "soft"])
      .default("product"),
    darkAccent: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .optional(),
    overrides: z
      .object({ light: overridesSchema, dark: overridesSchema })
      .default({ light: {}, dark: {} }),
  }),
});

export type HestiaProject = z.infer<typeof hestiaSchema>["project"];

export function createProject(): HestiaProject {
  return {
    name: "Mon design system",
    palette: "atlas",
    customAccent: "#2f6f58",
    typography: "plex",
    scale: "standard",
    radius: 8,
    shadow: "soft",
    mode: "light",
    style: "product",
    overrides: { light: {}, dark: {} },
  };
}

export function parseProject(input: unknown): HestiaProject {
  return hestiaSchema.parse(input).project;
}

export function serializeProject(project: HestiaProject) {
  return JSON.stringify(
    {
      format: "atlas-hestia",
      version: 2,
      project: parseProject({ format: "atlas-hestia", version: 2, project }),
    },
    null,
    2,
  );
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map(
    (offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
  );
}

function linear(channel: number) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(linear);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(first: string, second: string) {
  const [light, dark] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (light! + 0.05) / (dark! + 0.05);
}

export function readableOn(background: string) {
  return contrastRatio("#ffffff", background) >=
    contrastRatio("#111827", background)
    ? "#ffffff"
    : "#111827";
}

export function mix(first: string, second: string, amount: number) {
  const a = hexToRgb(first),
    b = hexToRgb(second);
  return (
    "#" +
    a
      .map((channel, i) =>
        Math.round((channel * (1 - amount) + b[i]! * amount) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export const styles = [
  {
    id: "minimal",
    name: "Minimal",
    description:
      "Contenu d’abord. Traits fins, angles nets, beaucoup de respiration.",
    palette: "mono",
    typography: "plex",
    radius: 2,
    scale: "airy",
    shadow: "none",
  },
  {
    id: "editorial",
    name: "Éditorial",
    description: "Titres serif, surfaces chaudes et rythme de lecture ample.",
    palette: "ink",
    typography: "editorial",
    radius: 4,
    scale: "airy",
    shadow: "none",
  },
  {
    id: "product",
    name: "Produit",
    description:
      "Une interface dense et lisible, adaptée aux outils et tableaux de bord.",
    palette: "ocean",
    typography: "plex",
    radius: 8,
    scale: "compact",
    shadow: "soft",
  },
  {
    id: "brutalist",
    name: "Structure",
    description: "Contours affirmés, contraste graphique et ombres franches.",
    palette: "amber",
    typography: "system",
    radius: 0,
    scale: "standard",
    shadow: "elevated",
  },
  {
    id: "soft",
    name: "Organique",
    description: "Sauge, arrondis généreux et hiérarchie douce.",
    palette: "sage",
    typography: "plex",
    radius: 18,
    scale: "standard",
    shadow: "soft",
  },
] as const;

export function applyStyle(
  project: HestiaProject,
  id: HestiaProject["style"],
): HestiaProject {
  const style = styles.find((s) => s.id === id)!;
  return {
    ...project,
    style: id,
    palette: style.palette,
    customAccent: palettes.find((p) => p.id === style.palette)!.accent,
    darkAccent: undefined,
    typography: style.typography,
    radius: style.radius,
    scale: style.scale,
    shadow: style.shadow,
    overrides: { light: {}, dark: {} },
  };
}

export function designValues(project: HestiaProject) {
  const scale = scaleValues[project.scale];
  const type = typography.find((t) => t.id === project.typography)!;
  return {
    ...scale,
    sans: type.sans,
    mono: type.mono,
    radius: project.radius,
    shadow:
      project.shadow === "none"
        ? "none"
        : project.style === "brutalist"
          ? "5px 5px 0 currentColor"
          : project.shadow === "soft"
            ? "0 8px 24px #00000012"
            : "0 16px 42px #00000026",
    borderWidth: project.style === "brutalist" ? 2 : 1,
  };
}

export function colorRamp(color: string) {
  return [0.96, 0.9, 0.78, 0.62, 0.32, 0, -0.18, -0.35, -0.52, -0.65, -0.8].map(
    (value, i) => ({
      step: i === 0 ? 50 : i === 10 ? 950 : i * 100,
      color:
        value >= 0
          ? mix(color, "#ffffff", value)
          : mix(color, "#000000", -value),
    }),
  );
}

export function harmonies(color: string) {
  const [r, g, b] = hexToRgb(color);
  const max = Math.max(r!, g!, b!),
    min = Math.min(r!, g!, b!),
    delta = max - min;
  let hue =
    delta === 0
      ? 0
      : max === r
        ? ((g! - b!) / delta) % 6
        : max === g
          ? (b! - r!) / delta + 2
          : (r! - g!) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  const light = (max + min) / 2,
    saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * light - 1));
  const rotate = (offset: number) => {
    const h = ((hue + offset) % 360) / 60,
      c = (1 - Math.abs(2 * light - 1)) * saturation,
      x = c * (1 - Math.abs((h % 2) - 1)),
      m = light - c / 2;
    const rgb =
      h < 1
        ? [c, x, 0]
        : h < 2
          ? [x, c, 0]
          : h < 3
            ? [0, c, x]
            : h < 4
              ? [0, x, c]
              : h < 5
                ? [x, 0, c]
                : [c, 0, x];
    return (
      "#" +
      rgb
        .map((v) =>
          Math.round((v + m) * 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  };
  return [
    { name: "Analogue", colors: [rotate(330), color, rotate(30)] },
    { name: "Complémentaire", colors: [color, rotate(180)] },
    { name: "Triadique", colors: [color, rotate(120), rotate(240)] },
  ];
}

export function exportTokens(project: HestiaProject) {
  return JSON.stringify(
    {
      name: project.name,
      themes: {
        light: tokens(project, "light"),
        dark: tokens(project, "dark"),
      },
      foundations: designValues(project),
      brandScale: colorRamp(project.customAccent),
    },
    null,
    2,
  );
}

export function exportHtml(project: HestiaProject) {
  const name = project.name
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  return `<!doctype html><html lang="fr" data-theme="${project.mode}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><style>${exportCss(project)}
*{box-sizing:border-box}body{margin:0;padding:clamp(24px,6vw,80px);background:var(--background);color:var(--foreground);font:var(--text-body)/1.7 var(--font-sans)}main{max-width:1000px;margin:auto}h1{font-size:var(--text-heading)}section{padding:calc(var(--space-unit)*4);background:var(--surface);border:var(--border-width) solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);margin:24px 0}button,input{font:inherit;padding:12px;border-radius:var(--radius);border:1px solid var(--border)}button{background:var(--brand);color:var(--brand-foreground)}input{background:var(--background);color:var(--foreground)}:focus-visible{outline:2px solid var(--focus);outline-offset:3px}small{color:var(--muted)}
</style><main><small>Made on Atlas by Hestia</small><h1>${name}</h1><p>Votre base visuelle, prête à construire.</p><section><h2>Des composants cohérents</h2><p>Une palette sémantique, une typographie et un rythme communs.</p><button type="button">Action principale</button></section><section><h2>Formulaire</h2><label for="email">Adresse e-mail</label><p><input id="email" type="email" placeholder="vous@exemple.fr"></p><button type="button">Continuer</button></section></main></html>`;
}

export function activePalette(project: HestiaProject) {
  const base =
    palettes.find((palette) => palette.id === project.palette) ?? palettes[0]!;
  return {
    ...base,
    accent: project.customAccent,
    darkAccent:
      project.darkAccent ??
      (project.customAccent === base.accent
        ? base.darkAccent
        : mix(project.customAccent, "#ffffff", 0.45)),
  };
}

export function tokens(project: HestiaProject, mode: ThemeMode = project.mode) {
  const palette = activePalette(project);
  const dark = mode === "dark";
  const background = dark
    ? mix(palette.swatches[4], "#000000", 0.48)
    : palette.swatches[0];
  const surface = dark
    ? mix(palette.swatches[4], "#000000", 0.22)
    : palette.swatches[1];
  const border = dark
    ? mix(palette.swatches[4], "#ffffff", 0.15)
    : palette.swatches[2];
  const foreground = dark ? "#edf3ef" : palette.swatches[4];
  const muted = dark ? "#a8b4ac" : palette.swatches[3];
  const brand = dark ? palette.darkAccent : palette.accent;
  const result = {
    background,
    surface,
    foreground,
    muted,
    border,
    brand,
    brandForeground: readableOn(brand),
    focus: brand,
    success: dark ? "#8fd3ad" : "#26734d",
    warning: dark ? "#f0c36a" : "#8a5a00",
    danger: dark ? "#f2a3a3" : "#b42318",
  };
  const overrides = project.overrides[mode];
  const merged = { ...result, ...overrides };
  if (overrides.brand && !overrides.brandForeground)
    merged.brandForeground = readableOn(overrides.brand);
  return merged;
}

export function contrastAudit(
  project: HestiaProject,
  mode: ThemeMode = project.mode,
) {
  const palette = tokens(project, mode);
  return [
    {
      name: "Texte principal",
      foreground: palette.foreground,
      background: palette.background,
    },
    {
      name: "Texte secondaire",
      foreground: palette.muted,
      background: palette.surface,
    },
    {
      name: "Action principale",
      foreground: palette.brandForeground,
      background: palette.brand,
    },
    {
      name: "Lien sur surface",
      foreground: palette.brand,
      background: palette.surface,
    },
    {
      name: "Indicateur de focus",
      foreground: palette.focus,
      background: palette.surface,
      minimum: 3,
    },
    ...(["success", "warning", "danger"] as const).map((key) => ({
      name: { success: "Succès", warning: "Attention", danger: "Erreur" }[key],
      foreground: palette[key],
      background: palette.surface,
    })),
  ].map((pair) => ({
    ...pair,
    ratio: contrastRatio(pair.foreground, pair.background),
    minimum: "minimum" in pair ? pair.minimum! : 4.5,
    pass:
      contrastRatio(pair.foreground, pair.background) >=
      ("minimum" in pair ? pair.minimum! : 4.5),
  }));
}

export const scaleValues = {
  compact: { space: 4, text: 14, heading: 24 },
  standard: { space: 6, text: 15, heading: 28 },
  airy: { space: 8, text: 16, heading: 32 },
} as const;

export function exportCss(project: HestiaProject) {
  const light = tokens(project, "light");
  const dark = tokens(project, "dark");
  const type =
    typography.find((item) => item.id === project.typography) ?? typography[0]!;
  const scale = designValues(project);
  const shadow = scale.shadow;
  const primitives = [
    ...colorRamp(project.customAccent).map(
      (s) => `  --brand-${s.step}: ${s.color};`,
    ),
    ...[1, 2, 3, 4, 6, 8].map((n) => `  --space-${n}: ${scale.space * n}px;`),
  ].join("\n");
  const render = (set: typeof light) =>
    `  --background: ${set.background};\n  --surface: ${set.surface};\n  --foreground: ${set.foreground};\n  --muted: ${set.muted};\n  --border: ${set.border};\n  --brand: ${set.brand};\n  --brand-foreground: ${set.brandForeground};\n  --focus: ${set.focus};\n  --success: ${set.success};\n  --warning: ${set.warning};\n  --danger: ${set.danger};`;
  return `:root {\n${render(light)}\n${primitives}\n  --font-sans: ${type.sans};\n  --font-mono: ${type.mono};\n  --space-unit: ${scale.space}px;\n  --text-body: ${scale.text}px;\n  --text-heading: ${scale.heading}px;\n  --radius: ${project.radius}px;\n  --border-width: ${scale.borderWidth}px;\n  --shadow: ${shadow};\n}\n\n[data-theme="dark"] {\n${render(dark)}\n}\n`;
}
