// F022 — persistir Proposta gerada (F012).

import { prisma } from "@/lib/db";
import type { PropostaTexto } from "./gerarProposta";
import type { Precificacao } from "./precos";
import type { Prisma } from "@prisma/client";

export type PersistirPropostaInput = {
  userId: string;
  leadId: string;
  oportunidadeId?: string | null;
  proposta: PropostaTexto;
  precificacao: Precificacao;
  textoCopiavel: string;
};

export async function persistirProposta(input: PersistirPropostaInput) {
  const ultima = await prisma.proposta.findFirst({
    where: { lead_id: input.leadId, user_id: input.userId },
    orderBy: { versao: "desc" },
    select: { versao: true },
  });
  const versao = (ultima?.versao ?? 0) + 1;

  return prisma.proposta.create({
    data: {
      user_id: input.userId,
      lead_id: input.leadId,
      oportunidade_id: input.oportunidadeId ?? null,
      versao,
      resumo: input.proposta.resumo,
      escopo: input.proposta.escopo as Prisma.InputJsonValue,
      entregaveis: input.proposta.entregaveis as Prisma.InputJsonValue,
      prazo_estimado: input.proposta.prazo_estimado,
      observacoes: input.proposta.observacoes,
      faixa_min: input.precificacao.faixa_min,
      faixa_max: input.precificacao.faixa_max,
      servicos: input.precificacao.servicos as unknown as Prisma.InputJsonValue,
      texto_copiavel: input.textoCopiavel,
    },
  });
}
