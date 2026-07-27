"use server";

// F021 — mover estágio da Oportunidade.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { mensagemEscopo, requireOportunidadeOwned } from "@/lib/db/scoped";

const ESTAGIOS = [
  "novo",
  "abordado",
  "qualificando",
  "proposta",
  "fechado",
  "producao",
  "entregue",
  "recorrencia",
] as const;

const schema = z.object({
  oportunidade_id: z.string().min(1),
  estagio: z.enum(ESTAGIOS),
});

export type MoverEstagioState =
  | { kind: "idle" }
  | { kind: "ok" }
  | { kind: "erro"; mensagem: string };

export async function moverEstagioOportunidade(
  _prev: MoverEstagioState,
  formData: FormData,
): Promise<MoverEstagioState> {
  const parsed = schema.safeParse({
    oportunidade_id: formData.get("oportunidade_id"),
    estagio: formData.get("estagio"),
  });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Estágio inválido." };
  }

  try {
    const { oportunidade } = await requireOportunidadeOwned(
      parsed.data.oportunidade_id,
    );
    if (oportunidade.status === "lost") {
      return { kind: "erro", mensagem: "Oportunidade perdida não pode mudar de estágio." };
    }

    await prisma.oportunidade.update({
      where: { id: oportunidade.id },
      data: { estagio: parsed.data.estagio },
    });

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${oportunidade.id}`);
    return { kind: "ok" };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
