"use server";

// F021 — ganho / perdido / atualizar valor.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { mensagemEscopo, requireOportunidadeOwned } from "@/lib/db/scoped";

function revalidateOpp(id: string) {
  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${id}`);
}

export type StatusOppState =
  | { kind: "idle" }
  | { kind: "ok" }
  | { kind: "erro"; mensagem: string };

const ganhoSchema = z.object({
  oportunidade_id: z.string().min(1),
  valor: z
    .string()
    .trim()
    .transform((s) => s.replace(",", "."))
    .pipe(z.coerce.number().nonnegative("Valor inválido")),
});

export async function marcarGanhoOportunidade(
  _prev: StatusOppState,
  formData: FormData,
): Promise<StatusOppState> {
  const parsed = ganhoSchema.safeParse({
    oportunidade_id: formData.get("oportunidade_id"),
    valor: formData.get("valor") ?? "0",
  });
  if (!parsed.success) {
    return {
      kind: "erro",
      mensagem: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    const { oportunidade } = await requireOportunidadeOwned(
      parsed.data.oportunidade_id,
    );

    await prisma.oportunidade.update({
      where: { id: oportunidade.id },
      data: {
        status: "won",
        valor: parsed.data.valor,
        fechado_em: new Date(),
        motivo_perda: null,
      },
    });

    revalidateOpp(oportunidade.id);
    return { kind: "ok" };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}

const perdidoSchema = z.object({
  oportunidade_id: z.string().min(1),
  motivo: z.string().trim().min(1, "Informe o motivo"),
});

export async function marcarPerdidoOportunidade(
  _prev: StatusOppState,
  formData: FormData,
): Promise<StatusOppState> {
  const parsed = perdidoSchema.safeParse({
    oportunidade_id: formData.get("oportunidade_id"),
    motivo: formData.get("motivo"),
  });
  if (!parsed.success) {
    return {
      kind: "erro",
      mensagem: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    const { oportunidade } = await requireOportunidadeOwned(
      parsed.data.oportunidade_id,
    );

    await prisma.oportunidade.update({
      where: { id: oportunidade.id },
      data: {
        status: "lost",
        motivo_perda: parsed.data.motivo,
        fechado_em: null,
      },
    });

    revalidateOpp(oportunidade.id);
    return { kind: "ok" };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}

const valorSchema = z.object({
  oportunidade_id: z.string().min(1),
  valor: z
    .string()
    .trim()
    .transform((s) => (s === "" ? null : s.replace(",", ".")))
    .pipe(z.union([z.null(), z.coerce.number().nonnegative()])),
});

export async function atualizarValorOportunidade(
  _prev: StatusOppState,
  formData: FormData,
): Promise<StatusOppState> {
  const parsed = valorSchema.safeParse({
    oportunidade_id: formData.get("oportunidade_id"),
    valor: formData.get("valor") ?? "",
  });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Valor inválido." };
  }

  try {
    const { oportunidade } = await requireOportunidadeOwned(
      parsed.data.oportunidade_id,
    );

    await prisma.oportunidade.update({
      where: { id: oportunidade.id },
      data: { valor: parsed.data.valor },
    });

    revalidateOpp(oportunidade.id);
    return { kind: "ok" };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
