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
    sans: '"IBM Plex Sans Variable", "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", Consolas, monospace',
  },
] as const;

export type TypographyId = (typeof typography)[number]["id"];

export const hestiaSchema = z.object({
  format: z.literal("atlas-hestia"),
  version: z.literal(1),
  project: z.object({
    name: z.string().min(1).max(120),
    palette: z.string(),
    customAccent: z.string().regex(/^#[0-9a-f]{6}$/i),
    typography: z.enum(["plex", "system", "editorial"]),
    scale: z.enum(["compact", "standard", "airy"]),
    radius: z.number().int().min(0).max(24),
    shadow: z.enum(["none", "soft", "elevated"]),
    mode: z.enum(["light", "dark"]),
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
  };
}

export function parseProject(input: unknown): HestiaProject {
  return hestiaSchema.parse(input).project;
}

export function serializeProject(project: HestiaProject) {
  return JSON.stringify(
    { format: "atlas-hestia", version: 1, project },
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
  return channel <= 0.03928
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

export function activePalette(project: HestiaProject) {
  const base =
    palettes.find((palette) => palette.id === project.palette) ?? palettes[0]!;
  return {
    ...base,
    accent: project.customAccent,
    darkAccent: project.customAccent,
  };
}

export function tokens(project: HestiaProject, mode: ThemeMode = project.mode) {
  const palette = activePalette(project);
  const dark = mode === "dark";
  const background = dark ? "#171b19" : palette.swatches[0];
  const surface = dark ? "#202723" : palette.swatches[1];
  const border = dark ? "#39453f" : palette.swatches[2];
  const foreground = dark ? "#edf3ef" : "#202923";
  const muted = dark ? "#a8b4ac" : palette.swatches[3];
  const brand = dark ? palette.darkAccent : palette.accent;
  return {
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
  } as const;
}

export function contrastAudit(project: HestiaProject) {
  const palette = tokens(project, project.mode);
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
  ].map((pair) => ({
    ...pair,
    ratio: contrastRatio(pair.foreground, pair.background),
    pass: contrastRatio(pair.foreground, pair.background) >= 4.5,
  }));
}

const scaleValues = {
  compact: { space: 4, text: 14, heading: 24 },
  standard: { space: 6, text: 15, heading: 28 },
  airy: { space: 8, text: 16, heading: 32 },
} as const;

export function exportCss(project: HestiaProject) {
  const light = tokens(project, "light");
  const dark = tokens(project, "dark");
  const type =
    typography.find((item) => item.id === project.typography) ?? typography[0]!;
  const scale = scaleValues[project.scale];
  const shadow =
    project.shadow === "none"
      ? "none"
      : project.shadow === "soft"
        ? "0 8px 24px #17231b18"
        : "0 16px 42px #17231b26";
  const render = (set: typeof light) =>
    `  --background: ${set.background};\n  --surface: ${set.surface};\n  --foreground: ${set.foreground};\n  --muted: ${set.muted};\n  --border: ${set.border};\n  --brand: ${set.brand};\n  --brand-foreground: ${set.brandForeground};\n  --focus: ${set.focus};\n  --success: ${set.success};\n  --warning: ${set.warning};\n  --danger: ${set.danger};`;
  return `:root {\n${render(light)}\n  --font-sans: ${type.sans};\n  --font-mono: ${type.mono};\n  --space-unit: ${scale.space}px;\n  --text-body: ${scale.text}px;\n  --text-heading: ${scale.heading}px;\n  --radius: ${project.radius}px;\n  --shadow: ${shadow};\n}\n\n[data-theme="dark"] {\n${render(dark)}\n}\n`;
}
