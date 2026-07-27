"use server";

// F021 — marcar / desmarcar tarefa do playbook.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { mensagemEscopo, requireTenant, TenantNotFoundError } from "@/lib/db/scoped";

const schema = z.object({
  tarefa_id: z.string().min(1),
  concluida: z.enum(["true", "false"]),
});

export type ToggleTarefaState =
  | { kind: "idle" }
  | { kind: "ok" }
  | { kind: "erro"; mensagem: string };

export async function toggleTarefaOportunidade(
  _prev: ToggleTarefaState,
  formData: FormData,
): Promise<ToggleTarefaState> {
  const parsed = schema.safeParse({
    tarefa_id: formData.get("tarefa_id"),
    concluida: formData.get("concluida"),
  });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Tarefa inválida." };
  }

  try {
    const { userId } = await requireTenant();
    const tarefa = await prisma.tarefaOportunidade.findFirst({
      where: {
        id: parsed.data.tarefa_id,
        oportunidade: { user_id: userId },
      },
      select: { id: true, oportunidade_id: true },
    });
    if (!tarefa) throw new TenantNotFoundError("Tarefa");

    const concluida = parsed.data.concluida === "true";
    await prisma.tarefaOportunidade.update({
      where: { id: tarefa.id },
      data: {
        concluida,
        concluida_em: concluida ? new Date() : null,
      },
    });

    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${tarefa.oportunidade_id}`);
    return { kind: "ok" };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
