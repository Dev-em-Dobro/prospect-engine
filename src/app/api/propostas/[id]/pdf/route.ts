// F022 — GET /api/propostas/[id]/pdf

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { AuthError } from "@/lib/auth/errors";
import { montarPdfProposta } from "@/lib/proposta/pdf";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Nome de arquivo seguro pra Content-Disposition (ASCII). */
function nomeArquivoPdf(nomeNegocio: string): string {
  const slug = nomeNegocio
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `proposta${slug ? `-${slug}` : ""}.pdf`;
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;

    const proposta = await prisma.proposta.findFirst({
      where: { id, user_id: user.id },
      include: { lead: { select: { nome: true } } },
    });
    if (!proposta) {
      return NextResponse.json({ erro: "Proposta não encontrada" }, { status: 404 });
    }

    const bytes = await montarPdfProposta({
      nomeNegocio: proposta.lead.nome,
      texto: proposta.texto_copiavel,
    });

    const filename = nomeArquivoPdf(proposta.lead.nome);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    throw e;
  }
}
