"use server";

// F021 — criar Oportunidade a partir de um Lead.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { mensagemEscopo, requireLeadOwned } from "@/lib/db/scoped";
import { criarOportunidadeComPlaybook } from "@/lib/pipeline";

const schema = z.object({
  lead_id: z.string().min(1),
});

export type CriarDeLeadState =
  | { kind: "idle" }
  | { kind: "ok"; oportunidadeId: string; jaExistia: boolean }
  | { kind: "erro"; mensagem: string };

function cidadeDoEndereco(endereco: string): string | null {
  // "Rua X, Bairro - Cidade - UF, Brasil" — pega penúltimo segmento comum
  const partes = endereco.split(",").map((p) => p.trim());
  if (partes.length >= 2) {
    const talvez = partes[partes.length - 2] ?? "";
    const semUf = talvez.replace(/\s*-\s*[A-Z]{2}\s*$/, "").trim();
    return semUf || talvez || null;
  }
  return null;
}

export async function criarOportunidadeDeLead(
  _prev: CriarDeLeadState,
  formData: FormData,
): Promise<CriarDeLeadState> {
  const parsed = schema.safeParse({ lead_id: formData.get("lead_id") });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Lead inválido." };
  }

  try {
    const { userId, lead } = await requireLeadOwned(parsed.data.lead_id);

    const existente = await prisma.oportunidade.findFirst({
      where: {
        user_id: userId,
        lead_id: lead.id,
        status: "open",
      },
      select: { id: true },
    });

    if (existente) {
      revalidatePath("/pipeline");
      return {
        kind: "ok",
        oportunidadeId: existente.id,
        jaExistia: true,
      };
    }

    const criada = await criarOportunidadeComPlaybook({
      userId,
      leadId: lead.id,
      nomeNegocio: lead.nome,
      whatsapp: lead.telefone,
      cidade: cidadeDoEndereco(lead.endereco),
      nicho: lead.categoria,
      website: lead.website,
      origem: "orion",
    });

    revalidatePath("/pipeline");
    revalidatePath("/leads");

    return { kind: "ok", oportunidadeId: criada.id, jaExistia: false };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
