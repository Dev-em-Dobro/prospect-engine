// F021 — cria Oportunidade + seed do playbook (transação).

import type {
  EstagioOportunidade,
  OrigemOportunidade,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { PLAYBOOK_PADRAO } from "./playbook";

export type DadosNovaOportunidade = {
  userId: string;
  leadId?: string | null;
  nomeNegocio: string;
  contato?: string | null;
  whatsapp?: string | null;
  cidade?: string | null;
  nicho?: string | null;
  website?: string | null;
  origem: OrigemOportunidade;
  estagio?: EstagioOportunidade;
};

export async function criarOportunidadeComPlaybook(
  dados: DadosNovaOportunidade,
) {
  return prisma.$transaction(async (tx) => {
    const oportunidade = await tx.oportunidade.create({
      data: {
        user_id: dados.userId,
        lead_id: dados.leadId ?? null,
        nome_negocio: dados.nomeNegocio,
        contato: dados.contato ?? null,
        whatsapp: dados.whatsapp ?? null,
        cidade: dados.cidade ?? null,
        nicho: dados.nicho ?? null,
        website: dados.website ?? null,
        origem: dados.origem,
        estagio: dados.estagio ?? "novo",
      },
    });

    await tx.tarefaOportunidade.createMany({
      data: PLAYBOOK_PADRAO.map((item) => ({
        oportunidade_id: oportunidade.id,
        estagio: item.estagio,
        titulo: item.titulo,
        entregavel_slug: item.entregavel_slug,
        ordem: item.ordem,
      })),
    });

    return oportunidade;
  });
}

/** % de tarefas concluídas no estágio atual (0–100). */
export function percentualTarefasEstagio(
  tarefas: { estagio: EstagioOportunidade; concluida: boolean }[],
  estagio: EstagioOportunidade,
): number {
  const doEstagio = tarefas.filter((t) => t.estagio === estagio);
  if (doEstagio.length === 0) return 0;
  const feitas = doEstagio.filter((t) => t.concluida).length;
  return Math.round((feitas / doEstagio.length) * 100);
}

export type OportunidadeComTarefas = Prisma.OportunidadeGetPayload<{
  include: { tarefas: true };
}>;
