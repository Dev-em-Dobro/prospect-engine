"use server";

// F021 — nota livre na Oportunidade.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { mensagemEscopo, requireOportunidadeOwned } from "@/lib/db/scoped";

const schema = z.object({
  oportunidade_id: z.string().min(1),
  corpo: z.string().trim().min(1, "Escreva a nota"),
});

export type AdicionarNotaState =
  | { kind: "idle" }
  | { kind: "ok" }
  | { kind: "erro"; mensagem: string };

export async function adicionarNotaOportunidade(
  _prev: AdicionarNotaState,
  formData: FormData,
): Promise<AdicionarNotaState> {
  const parsed = schema.safeParse({
    oportunidade_id: formData.get("oportunidade_id"),
    corpo: formData.get("corpo"),
  });
  if (!parsed.success) {
    return {
      kind: "erro",
      mensagem: parsed.error.issues[0]?.message ?? "Nota inválida.",
    };
  }

  try {
    const { oportunidade } = await requireOportunidadeOwned(
      parsed.data.oportunidade_id,
    );

    await prisma.notaOportunidade.create({
      data: {
        oportunidade_id: oportunidade.id,
        corpo: parsed.data.corpo,
      },
    });

    revalidatePath(`/pipeline/${oportunidade.id}`);
    return { kind: "ok" };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
