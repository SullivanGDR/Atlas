import { parseProject } from "@/features/db-designer/model/schema";
import {
  generateFastAPI,
  zipProject,
} from "@/features/db-designer/generators/fastapi";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json({ error: "Projet manquant." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 5 * 1024 * 1024) {
        await reader.cancel();
        return Response.json(
          { error: "Le projet dépasse 5 Mo." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
    const schema = parseProject(JSON.parse(new TextDecoder().decode(body)));
    const zip = zipProject(generateFastAPI(schema));
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="athena-fastapi.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && error.name !== "ZodError"
            ? error.message
            : "Projet invalide.",
      },
      { status: 400 },
    );
  }
}
