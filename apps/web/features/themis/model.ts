import { z } from "zod";

export const priorities = [
  "Indispensable",
  "Important",
  "Souhaitable",
  "Hors version",
] as const;
export const requirementTypes = [
  "Fonctionnelle",
  "Performance",
  "Sécurité",
  "Accessibilité",
  "Données",
  "Interface",
  "Exploitation",
] as const;
const text = z.string().max(300);
const body = z.string().max(40000);
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w-]+$/);
const sectionSchema = z.object({
  id,
  title: text.min(1),
  content: body,
  included: z.boolean(),
  reviewed: z.boolean(),
});
const requirementSchema = z.object({
  id: z.string().regex(/^REQ-\d{3,6}$/),
  title: text,
  description: body,
  acceptance: body,
  rationale: body,
  owner: text,
  priority: z.enum(priorities),
  type: z.enum(requirementTypes),
  status: z.enum(["Brouillon", "À valider", "Validée"]),
});
const projectSchema = z.object({
  name: text.min(1),
  template: z
    .enum(["general", "web", "website", "infrastructure"])
    .default("general"),
  client: text,
  author: text,
  version: text,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
  status: z.enum(["Brouillon", "En relecture", "Validé"]),
  confidentiality: z.enum(["Interne", "Public", "Confidentiel"]),
  sections: z.array(sectionSchema).min(1).max(50),
  requirements: z.array(requirementSchema).max(300),
  nextRequirement: z.number().int().min(1).max(999999),
});
export type SpecProject = z.infer<typeof projectSchema>;
export type SpecSection = z.infer<typeof sectionSchema>;
export type Requirement = z.infer<typeof requirementSchema>;
export type ExportOptions = {
  cover: boolean;
  contents: boolean;
  includeEmpty: boolean;
  pageSize: "A4" | "Letter";
};
export const defaultExportOptions: ExportOptions = {
  cover: true,
  contents: true,
  includeEmpty: false,
  pageSize: "Letter",
};
export function parseProject(value: unknown): SpecProject {
  const { project } = z
    .object({
      format: z.literal("atlas-themis"),
      version: z.literal(1),
      project: projectSchema,
    })
    .parse(value);
  for (const list of [project.sections, project.requirements])
    if (new Set(list.map((x) => x.id)).size !== list.length)
      throw new Error("Identifiants dupliqués dans le projet.");
  const largest = Math.max(
    0,
    ...project.requirements.map((r) => Number(r.id.slice(4))),
  );
  project.nextRequirement = Math.max(project.nextRequirement, largest + 1);
  if (project.nextRequirement > 999999)
    throw new Error("Limite d’identifiants atteinte.");
  return project;
}
export function serializeProject(project: SpecProject) {
  const file = { format: "atlas-themis", version: 1, project };
  parseProject(file);
  return JSON.stringify(file, null, 2);
}
export function addRequirement(project: SpecProject) {
  if (project.requirements.length >= 300)
    throw new Error("Limite de 300 exigences atteinte.");
  if (project.nextRequirement >= 999999)
    throw new Error("Limite d’identifiants atteinte.");
  const requirement: Requirement = {
    id: `REQ-${String(project.nextRequirement++).padStart(3, "0")}`,
    title: "",
    description: "",
    acceptance: "",
    rationale: "",
    owner: "",
    priority: "Indispensable",
    type: "Fonctionnelle",
    status: "Brouillon",
  };
  project.requirements.push(requirement);
  return requirement.id;
}
export const hasPlaceholder = (text: string) =>
  /\[.*?\]|à préciser|à compléter|\btbd\b|\btodo\b/i.test(text);
export type ReviewIssue = {
  target: string;
  message: string;
  level: "missing" | "advice";
};
export function reviewProject(project: SpecProject): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  for (const [key, label] of [
    ["client", "Commanditaire"],
    ["author", "Rédacteur"],
    ["version", "Version"],
    ["date", "Date"],
  ] as const)
    if (!project[key].trim())
      issues.push({
        target: "metadata",
        level: "missing",
        message: `${label} à renseigner.`,
      });
  for (const section of project.sections.filter((s) => s.included)) {
    if (!section.content.trim())
      issues.push({
        target: section.id,
        level: "missing",
        message: `${section.title} : rubrique vide.`,
      });
    else if (hasPlaceholder(section.content))
      issues.push({
        target: section.id,
        level: "missing",
        message: `${section.title} : éléments à préciser.`,
      });
    if (!section.reviewed && section.content.trim())
      issues.push({
        target: section.id,
        level: "advice",
        message: `${section.title} : relecture à confirmer.`,
      });
  }
  if (!project.requirements.length)
    issues.push({
      target: "requirements",
      level: "missing",
      message:
        "Aucune exigence définie. Ajoutez au moins un besoin vérifiable.",
    });
  for (const r of project.requirements) {
    if (r.priority === "Hors version") continue;
    const prefix = r.id;
    if (!r.title.trim() || !r.description.trim())
      issues.push({
        target: r.id,
        level: "missing",
        message: `${prefix} : titre ou description manquant.`,
      });
    if (!r.acceptance.trim())
      issues.push({
        target: r.id,
        level: "missing",
        message: `${prefix} : critère de recette manquant.`,
      });
    if (hasPlaceholder(`${r.description} ${r.acceptance}`))
      issues.push({
        target: r.id,
        level: "missing",
        message: `${prefix} : valeurs à préciser avant validation.`,
      });
    if (
      /\b(rapide|facile|intuitif|robuste|optimal|performant|simple)\b/i.test(
        `${r.description} ${r.acceptance}`,
      )
    )
      issues.push({
        target: r.id,
        level: "advice",
        message: `${prefix} : remplacez les qualificatifs vagues par un résultat mesurable.`,
      });
    if (!r.owner.trim())
      issues.push({
        target: r.id,
        level: "advice",
        message: `${prefix} : responsable de validation non renseigné.`,
      });
    if (r.status !== "Validée")
      issues.push({
        target: r.id,
        level: "advice",
        message: `${prefix} : exigence à faire valider.`,
      });
  }
  return issues;
}
export type Block = { kind: "paragraph" | "bullet" | "heading"; text: string };
export function blocks(content: string): Block[] {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) =>
      line.startsWith("## ")
        ? { kind: "heading", text: line.slice(3) }
        : /^[-*] /.test(line)
          ? { kind: "bullet", text: line.slice(2) }
          : { kind: "paragraph", text: line },
    );
}
export function exportSections(project: SpecProject, options: ExportOptions) {
  return project.sections.filter(
    (s) => s.included && (options.includeEmpty || s.content.trim()),
  );
}
export function documentChapters(project: SpecProject, options: ExportOptions) {
  const chapters: {
    id: string;
    title: string;
    content: string;
    requirements?: Requirement[];
  }[] = exportSections(project, options).map((s) => ({
    id: s.id,
    title: s.title,
    content: s.content,
  }));
  if (project.requirements.length || options.includeEmpty) {
    const index = chapters.findIndex((s) => s.id === "data");
    chapters.splice(index < 0 ? Math.min(5, chapters.length) : index, 0, {
      id: "requirements",
      title: "Exigences et critères de recette",
      content: "",
      requirements: project.requirements,
    });
  }
  return chapters;
}
