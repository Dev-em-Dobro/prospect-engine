"use server";

// F022 — marcar Proposta como enviada.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { mensagemEscopo, requireTenant } from "@/lib/db/scoped";

const schema = z.object({
  proposta_id: z.string().cuid(),
});

export type MarcarPropostaEnviadaState =
  | { kind: "idle" }
  | { kind: "ok"; mensagem: string }
  | { kind: "erro"; mensagem: string };

export async function marcarPropostaEnviada(
  _prev: MarcarPropostaEnviadaState,
  formData: FormData,
): Promise<MarcarPropostaEnviadaState> {
  const parsed = schema.safeParse({
    proposta_id: formData.get("proposta_id"),
  });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Input inválido" };
  }

  try {
    const { userId } = await requireTenant();
    const row = await prisma.proposta.findFirst({
      where: { id: parsed.data.proposta_id, user_id: userId },
      select: { id: true, lead_id: true, oportunidade_id: true },
    });
    if (!row) {
      return { kind: "erro", mensagem: "Proposta não encontrada" };
    }

    await prisma.proposta.update({
      where: { id: row.id },
      data: { enviada: true, enviada_em: new Date() },
    });

    revalidatePath("/leads");
    if (row.oportunidade_id) {
      revalidatePath(`/pipeline/${row.oportunidade_id}`);
    }

    return { kind: "ok", mensagem: "Proposta marcada como enviada." };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
