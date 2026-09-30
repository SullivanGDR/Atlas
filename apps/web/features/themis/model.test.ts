import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import {
  addRequirement,
  blocks,
  defaultExportOptions,
  documentChapters,
  parseProject,
  reviewProject,
  serializeProject,
} from "./model";
import { createProject, guides, outlineFor } from "./templates";
import { createDocx } from "./docx";
import { useThemis } from "./store";

describe("Thémis — rédaction et projets portables", () => {
  it("roundtrips metadata, sections and stable requirement IDs", () => {
    const p = createProject("web");
    expect(addRequirement(p)).toBe("REQ-001");
    p.requirements = [];
    expect(addRequirement(p)).toBe("REQ-002");
    expect(parseProject(JSON.parse(serializeProject(p)))).toEqual(p);
    expect(() =>
      parseProject({ format: "atlas-iris", version: 1, project: p }),
    ).toThrow();
    p.requirements.push({ ...p.requirements[0]! });
    expect(() => serializeProject(p)).toThrow();
  });
  it("reports missing acceptance, placeholders and ambiguous wording without inventing approval", () => {
    const p = createProject();
    addRequirement(p);
    const r = p.requirements[0]!;
    r.title = "Consulter";
    r.description = "Le système doit être rapide.";
    expect(
      reviewProject(p).some(
        (i) => i.target === r.id && i.message.includes("recette manquant"),
      ),
    ).toBe(true);
    expect(
      reviewProject(p).some((i) => i.target === r.id && i.level === "advice"),
    ).toBe(true);
    r.acceptance = "Résultat sous [durée] secondes";
    expect(
      reviewProject(p).some((i) => i.message.includes("valeurs à préciser")),
    ).toBe(true);
    p.sections[0]!.content = outlineFor("web", "context");
    expect(
      reviewProject(p).some(
        (i) => i.target === "context" && i.level === "missing",
      ),
    ).toBe(true);
  });
  it("preserves excluded content in JSON while omitting it from the document", () => {
    const p = createProject();
    p.sections[0]!.content = "Secret exclu";
    p.sections[0]!.included = false;
    p.sections[1]!.content = "Objectif retenu";
    expect(serializeProject(p)).toContain("Secret exclu");
    expect(documentChapters(p, defaultExportOptions).map((c) => c.id)).toEqual([
      "goals",
    ]);
    expect(
      documentChapters(p, { ...defaultExportOptions, includeEmpty: true }),
    ).toHaveLength(15);
  });
  it("groups typing into one undo step and retains a separate review action", () => {
    useThemis.getState().replace(createProject());
    useThemis.getState().edit((p) => {
      p.sections[0]!.content = "Un";
    }, "content");
    useThemis.getState().edit((p) => {
      p.sections[0]!.content = "Un texte";
    }, "content");
    useThemis.getState().undo();
    expect(useThemis.getState().project.sections[0]!.content).toBe("");
    useThemis.getState().redo();
    expect(useThemis.getState().project.sections[0]!.content).toBe("Un texte");
  });
  it("keeps plain content safe while recognizing supported formatting", () => {
    expect(
      blocks("## Titre\n- Élément\nTexte **gras**\n<script>").map(
        (b) => b.kind,
      ),
    ).toEqual(["heading", "bullet", "paragraph", "paragraph"]);
  });
});

describe("Thémis — export Word natif", () => {
  it("contains real styles, list numbering, bookmarks, repeated table headers and page fields", () => {
    const p = createProject("web");
    p.name = "Portail des demandes";
    p.client = "Organisation exemple";
    p.author = "Équipe projet";
    p.date = "2026-09-30";
    p.version = "1.0";
    for (const s of p.sections) {
      s.content = guides.find((g) => g.id === s.id)!.example;
      s.reviewed = true;
    }
    for (let i = 0; i < 3; i++) {
      addRequirement(p);
      Object.assign(p.requirements.at(-1)!, {
        title: [
          "Déposer une demande",
          "Consulter les demandes autorisées",
          "Exporter les demandes",
        ][i],
        description: [
          "Le système doit permettre au collaborateur de déposer une demande comprenant un objet et une description. Les champs obligatoires sont vérifiés avant confirmation.",
          "Le système doit présenter uniquement les demandes accessibles au rôle de l’utilisateur connecté.",
          "Le gestionnaire doit pouvoir exporter les demandes du périmètre sélectionné au format CSV UTF-8.",
        ][i],
        acceptance:
          "- Étant donné un utilisateur authentifié et un jeu de données de recette\n- Quand il exécute le parcours prévu\n- Alors le résultat correspond aux données attendues, sans perte ni ajout de ligne\n- Un test distinct vérifie le refus d’un accès non autorisé",
        rationale:
          "Ce besoin garantit un suivi commun des demandes par les équipes concernées.",
        owner: "Responsable métier",
        status: "À valider",
      });
    }
    const bytes = createDocx(p, defaultExportOptions);
    const zip = unzipSync(bytes);
    const document = strFromU8(zip["word/document.xml"]!);
    expect(document).toContain("w:bookmarkStart");
    expect(document).toContain("w:tblHeader");
    expect(document).toContain("w:numPr");
    expect(strFromU8(zip["word/footer1.xml"]!)).toContain('w:instr="PAGE"');
    expect(strFromU8(zip["word/styles.xml"]!)).toContain(
      'w:name w:val="Title"',
    );
    expect(document).not.toContain("w:altChunk");
    expect(Object.keys(zip)).toContain("[Content_Types].xml");
    if (process.env.THEMIS_QA_DIR) {
      mkdirSync(process.env.THEMIS_QA_DIR, { recursive: true });
      writeFileSync(
        join(process.env.THEMIS_QA_DIR, "themis-example.docx"),
        bytes,
      );
      writeFileSync(
        join(process.env.THEMIS_QA_DIR, "themis-example.atlas.json"),
        serializeProject(p),
      );
    }
  });
  it("escapes XML, handles long requirements and respects layout options", () => {
    const p = createProject();
    p.name = 'Projet <test> & "exemple"';
    p.sections[0]!.content =
      "Texte <script> & données\u0001\n- Élément **important**";
    for (let i = 0; i < 45; i++) {
      addRequirement(p);
      Object.assign(p.requirements.at(-1)!, {
        title: `Exigence ${i + 1} avec un intitulé détaillé et une contrainte à vérifier`,
        description: "Une description longue. ".repeat(30),
        acceptance: "Résultat vérifiable à contrôler lors de la recette.",
      });
    }
    const bytes = createDocx(p, {
      ...defaultExportOptions,
      cover: false,
      contents: false,
      pageSize: "A4",
    });
    const xml = strFromU8(unzipSync(bytes)["word/document.xml"]!);
    expect(xml).toContain("&lt;test&gt; &amp; &quot;exemple&quot;");
    expect(xml).not.toContain("\u0001");
    expect(xml).toContain('w:w="11906"');
    expect(xml).not.toContain('w:type="page"');
    expect(xml).toContain("REQ-045");
  });
});
