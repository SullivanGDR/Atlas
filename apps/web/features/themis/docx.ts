import { strToU8, zipSync } from "fflate";
import {
  blocks,
  documentChapters,
  type ExportOptions,
  type SpecProject,
} from "./model";

// Deliberately limited OOXML: native text, headings, lists and tables, no text boxes or HTML imports.
const xml = (value: string) =>
  value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(
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
const run = (text: string, bold = false) =>
  `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
const rich = (text: string) =>
  text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((s) =>
      s.startsWith("**") && s.endsWith("**")
        ? run(s.slice(2, -2), true)
        : run(s),
    )
    .join("");
const paragraph = (text: string, style = "Normal", extra = "") =>
  `<w:p><w:pPr><w:pStyle w:val="${style}"/>${extra}</w:pPr>${rich(text)}</w:p>`;
const content = (value: string) =>
  blocks(value)
    .map((b) =>
      paragraph(
        b.text,
        b.kind === "heading" ? "Heading2" : "Normal",
        b.kind === "bullet"
          ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
          : "",
      ),
    )
    .join("");
const pageBreak = () => '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
const heading = (title: string, index: number) =>
  `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:bookmarkStart w:id="${index}" w:name="chapter_${index}"/>${run(`${index} ${title}`)}<w:bookmarkEnd w:id="${index}"/></w:p>`;
const borders =
  "<w:tblBorders>" +
  ["top", "left", "bottom", "right", "insideH", "insideV"]
    .map((edge) => `<w:${edge} w:val="single" w:sz="4" w:color="D9D9D9"/>`)
    .join("") +
  "</w:tblBorders>";
function table(headers: string[], rows: string[][], widths: number[]) {
  const row = (cells: string[], header: boolean, index: number) =>
    `<w:tr><w:trPr>${header ? "<w:tblHeader/>" : ""}</w:trPr>${cells.map((value, i) => `<w:tc><w:tcPr><w:tcW w:w="${widths[i]}" w:type="dxa"/><w:vAlign w:val="center"/><w:shd w:fill="${header ? "E8E8E8" : index % 2 ? "F7F7F7" : "FFFFFF"}"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="TableText"/>${i === 0 ? '<w:jc w:val="center"/>' : ""}</w:pPr>${run(value, header)}</w:p></w:tc>`).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}<w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${row(headers, true, 0)}${rows.map((r, i) => row(r, false, i)).join("")}</w:tbl>${paragraph("")}`;
}
const ns =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const prolog = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
export function createDocx(
  project: SpecProject,
  options: ExportOptions,
): Uint8Array {
  const chapters = documentChapters(project, options);
  const pageWidth = options.pageSize === "A4" ? 11906 : 12240;
  const pageHeight = options.pageSize === "A4" ? 16838 : 15840;
  const usable = pageWidth - 2880;
  const metadata = [
    `Version ${project.version || "Non renseignée"}`,
    project.date || "Date non renseignée",
    project.status,
    project.confidentiality,
  ].join(" · ");
  let document =
    paragraph("Cahier des charges", "Subtitle") +
    paragraph(project.name, "Title") +
    paragraph(metadata, "Meta") +
    paragraph(`Commanditaire : ${project.client || "Non renseigné"}`, "Meta") +
    paragraph(`Rédacteur : ${project.author || "Non renseigné"}`, "Meta");
  document += paragraph(
    "Ce document définit le besoin, le périmètre, les exigences et les conditions de validation du projet. Il sert de référence commune aux parties prenantes.",
  );
  if (project.status !== "Validé")
    document += paragraph(
      "Document de travail à relire et à faire valider par les parties prenantes.",
      "Meta",
    );
  if (options.cover) document += pageBreak();
  if (options.contents && chapters.length) {
    document += paragraph("Sommaire", "TOCHeading");
    chapters.forEach((c, i) => {
      document += `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:hyperlink w:anchor="chapter_${i + 1}">${run(`${i + 1} ${c.title}`)}</w:hyperlink></w:p>`;
    });
    document += pageBreak();
  }
  chapters.forEach((chapter, i) => {
    document += heading(chapter.title, i + 1);
    if (chapter.requirements) {
      if (!chapter.requirements.length)
        document += paragraph("Aucune exigence renseignée.", "Meta");
      else {
        document += paragraph(
          "Synthèse des exigences. La priorité « Hors version » identifie les éléments exclus de la livraison considérée.",
          "Meta",
        );
        document += table(
          ["Réf.", "Exigence", "Priorité", "Statut"],
          chapter.requirements.map((r) => [
            r.id,
            r.title || "Sans titre",
            r.priority,
            r.status,
          ]),
          [1200, usable - 4300, 1550, 1550],
        );
        for (const r of chapter.requirements) {
          document += paragraph(
            `${r.id} ${r.title || "Sans titre"}`,
            "Heading2",
          );
          document += paragraph(
            `${r.type} · ${r.priority} · ${r.status} · Responsable : ${r.owner || "Non renseigné"}`,
            "Meta",
          );
          document += content(r.description || "Description non renseignée.");
          if (r.rationale)
            document +=
              paragraph("Justification", "Heading3") + content(r.rationale);
          document +=
            paragraph("Critères de recette", "Heading3") +
            content(r.acceptance || "Critères non renseignés.");
        }
      }
    } else document += content(chapter.content || "Rubrique non renseignée.");
  });
  if (!chapters.length)
    document += paragraph(
      "Aucune rubrique renseignée. Complétez le document avant diffusion.",
    );
  document += `<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="${pageWidth}" w:h="${pageHeight}"/><w:pgMar w:top="1200" w:right="1440" w:bottom="1200" w:left="1440" w:header="550" w:footer="550"/><w:cols w:space="720"/></w:sectPr>`;
  const style = (
    id: string,
    name: string,
    size: number,
    bold = false,
    extra = "",
  ) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr>${extra}</w:pPr><w:rPr><w:color w:val="000000"/><w:sz w:val="${size}"/>${bold ? "<w:b/>" : ""}</w:rPr></w:style>`;
  const styles = `<w:styles ${ns}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:color w:val="000000"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${style("Title", "Title", 48, true, '<w:spacing w:before="160" w:after="260"/><w:keepNext/>')}${style("Subtitle", "Subtitle", 24, false, "<w:keepNext/>")}${style("Meta", "Meta", 20, false, '<w:spacing w:after="160"/>')}${style("Heading1", "heading 1", 32, true, '<w:spacing w:before="240" w:after="120"/><w:keepNext/><w:keepLines/><w:outlineLvl w:val="0"/>')}${style("Heading2", "heading 2", 26, true, '<w:spacing w:before="240" w:after="120"/><w:keepNext/><w:keepLines/><w:outlineLvl w:val="1"/>')}${style("Heading3", "heading 3", 22, true, '<w:spacing w:before="160" w:after="80"/><w:keepNext/><w:keepLines/><w:outlineLvl w:val="2"/>')}${style("TOCHeading", "TOC Heading", 32, true, '<w:keepNext/><w:spacing w:after="220"/>')}${style("TableText", "Table Text", 20, false, '<w:spacing w:after="30" w:line="250" w:lineRule="auto"/>')}</w:styles>`;
  const relationships = (entries: [string, string, string][]) =>
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries.map(([id, type, target]) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`).join("")}</Relationships>`;
  const files: Record<string, string> = {
    "[Content_Types].xml": `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${[
      ["document", "document.main"],
      ["styles", "styles"],
      ["numbering", "numbering"],
      ["settings", "settings"],
      ["header1", "header"],
      ["footer1", "footer"],
    ]
      .map(
        ([part, type]) =>
          `<Override PartName="/word/${part}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${type}+xml"/>`,
      )
      .join("")}</Types>`,
    "_rels/.rels": relationships([
      ["rId1", "officeDocument", "word/document.xml"],
    ]),
    "word/_rels/document.xml.rels": relationships([
      ["rIdStyles", "styles", "styles.xml"],
      ["rIdNumbering", "numbering", "numbering.xml"],
      ["rIdSettings", "settings", "settings.xml"],
      ["rIdHeader", "header", "header1.xml"],
      ["rIdFooter", "footer", "footer1.xml"],
    ]),
    "word/document.xml": `<w:document ${ns}><w:body>${document}</w:body></w:document>`,
    "word/styles.xml": styles,
    "word/numbering.xml": `<w:numbering ${ns}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="360"/></w:tabs><w:ind w:left="360" w:hanging="180"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
    "word/settings.xml": `<w:settings ${ns}><w:defaultTabStop w:val="720"/><w:compat/></w:settings>`,
    "word/header1.xml": `<w:hdr ${ns}>${paragraph("Cahier des charges", "Meta")}</w:hdr>`,
    "word/footer1.xml": `<w:ftr ${ns}><w:p><w:pPr><w:pStyle w:val="Meta"/><w:tabs><w:tab w:val="right" w:pos="${usable}"/></w:tabs></w:pPr>${run("Made on Atlas by Thémis")}<w:r><w:tab/></w:r>${run("Page ")}<w:fldSimple w:instr="PAGE">${run("1")}</w:fldSimple></w:p></w:ftr>`,
  };
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, value]) => [
        name,
        strToU8(prolog + value),
      ]),
    ),
    { level: 6 },
  );
}
export function downloadFile(data: BlobPart, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
