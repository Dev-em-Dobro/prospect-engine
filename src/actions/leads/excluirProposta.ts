"use server";

// F022 — excluir Proposta em rascunho.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { mensagemEscopo, requireTenant } from "@/lib/db/scoped";

const schema = z.object({
  proposta_id: z.string().cuid(),
});

export type ExcluirPropostaState =
  | { kind: "idle" }
  | { kind: "ok"; mensagem: string }
  | { kind: "erro"; mensagem: string };

export async function excluirPropostaAction(
  _prev: ExcluirPropostaState,
  formData: FormData,
): Promise<ExcluirPropostaState> {
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
      select: {
        id: true,
        enviada: true,
        oportunidade_id: true,
      },
    });
    if (!row) {
      return { kind: "erro", mensagem: "Proposta não encontrada" };
    }
    if (row.enviada) {
      return {
        kind: "erro",
        mensagem: "Proposta já enviada não pode ser excluída.",
      };
    }

    await prisma.proposta.delete({ where: { id: row.id } });

    revalidatePath("/leads");
    revalidatePath("/pipeline");
    if (row.oportunidade_id) {
      revalidatePath(`/pipeline/${row.oportunidade_id}`);
    }

    return { kind: "ok", mensagem: "Rascunho excluído." };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
