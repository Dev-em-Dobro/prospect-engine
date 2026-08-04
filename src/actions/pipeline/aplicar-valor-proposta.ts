"use server";

// F022 — aplicar faixa_min da Proposta em Oportunidade.valor.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { mensagemEscopo, requireTenant } from "@/lib/db/scoped";

const schema = z.object({
  proposta_id: z.string().cuid(),
  oportunidade_id: z.string().cuid(),
});

export type AplicarValorPropostaState =
  | { kind: "idle" }
  | { kind: "ok"; mensagem: string; valor: number }
  | { kind: "erro"; mensagem: string };

export async function aplicarValorProposta(
  _prev: AplicarValorPropostaState,
  formData: FormData,
): Promise<AplicarValorPropostaState> {
  const parsed = schema.safeParse({
    proposta_id: formData.get("proposta_id"),
    oportunidade_id: formData.get("oportunidade_id"),
  });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Input inválido" };
  }

  try {
    const { userId } = await requireTenant();
    const proposta = await prisma.proposta.findFirst({
      where: { id: parsed.data.proposta_id, user_id: userId },
      select: { id: true, faixa_min: true, oportunidade_id: true },
    });
    if (!proposta) {
      return { kind: "erro", mensagem: "Proposta não encontrada" };
    }

    const opp = await prisma.oportunidade.findFirst({
      where: { id: parsed.data.oportunidade_id, user_id: userId },
      select: { id: true },
    });
    if (!opp) {
      return { kind: "erro", mensagem: "Oportunidade não encontrada" };
    }

    await prisma.oportunidade.update({
      where: { id: opp.id },
      data: { valor: proposta.faixa_min },
    });

    if (!proposta.oportunidade_id) {
      await prisma.proposta.update({
        where: { id: proposta.id },
        data: { oportunidade_id: opp.id },
      });
    }

    revalidatePath(`/pipeline/${opp.id}`);
    revalidatePath("/pipeline");

    return {
      kind: "ok",
      mensagem: "Valor da Oportunidade atualizado com a faixa mínima.",
      valor: proposta.faixa_min,
    };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
