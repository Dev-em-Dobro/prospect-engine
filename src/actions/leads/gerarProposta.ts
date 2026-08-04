"use server";

// F012 + F022 — Gerador de Proposta com persistência.
// Spec: F012-gerador-de-proposta.md + F022-proposta-persistida-pdf-pipeline.md

import { createLlmForUser } from "@/lib/llm";
import { consumirCota, verificarCota } from "@/lib/limites";
import { mensagemEscopo, requireTenant } from "@/lib/db/scoped";
import { detectarDores, textosDasDores } from "@/lib/dores";
import { servicosRecomendados } from "@/lib/proposta/servicos";
import { precificar, type Precificacao } from "@/lib/proposta/precos";
import { formatarPropostaTexto } from "@/lib/proposta/formatar";
import { persistirProposta } from "@/lib/proposta/persistir";
import {
  gerarProposta as gerarPropostaLib,
  PropostaError,
  type PropostaTexto,
} from "@/lib/proposta/gerarProposta";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  lead_id: z.string().cuid("lead_id inválido"),
  oportunidade_id: z.string().cuid().optional().or(z.literal("")),
});

export type GerarPropostaState =
  | { kind: "idle" }
  | {
      kind: "ok";
      propostaId: string;
      versao: number;
      proposta: PropostaTexto;
      precificacao: Precificacao;
      textoCopiavel: string;
    }
  | { kind: "erro"; mensagem: string };

export async function gerarPropostaAction(
  _prev: GerarPropostaState,
  formData: FormData,
): Promise<GerarPropostaState> {
  const rawOpp = formData.get("oportunidade_id");
  const parsed = schema.safeParse({
    lead_id: formData.get("lead_id"),
    oportunidade_id:
      typeof rawOpp === "string" && rawOpp.length > 0 ? rawOpp : undefined,
  });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Input inválido" };
  }

  try {
    const { userId } = await requireTenant();
    await verificarCota(userId, "proposta");
    const llm = await createLlmForUser(userId);

    let oportunidadeId: string | null = parsed.data.oportunidade_id ?? null;
    if (oportunidadeId) {
      const opp = await prisma.oportunidade.findFirst({
        where: { id: oportunidadeId, user_id: userId },
        select: { id: true, lead_id: true },
      });
      if (!opp) {
        return { kind: "erro", mensagem: "Oportunidade não encontrada" };
      }
      if (opp.lead_id !== parsed.data.lead_id) {
        return {
          kind: "erro",
          mensagem: "Lead da Oportunidade não confere",
        };
      }
    }

    const lead = await prisma.lead.findFirst({
      where: { id: parsed.data.lead_id, user_id: userId },
      include: {
        diagnosticos: { orderBy: { executado_em: "desc" }, take: 1 },
        dores: true,
      },
    });
    if (!lead) {
      return { kind: "erro", mensagem: "Lead não encontrado" };
    }

    const diag = lead.diagnosticos[0];
    if (!diag) {
      return {
        kind: "erro",
        mensagem: "Diagnostique o Lead antes de gerar a Proposta",
      };
    }

    const dores =
      lead.dores.length > 0
        ? textosDasDores(lead.dores)
        : textosDasDores(detectarDores(diag, lead.website));
    const servicos = servicosRecomendados(diag);
    const precificacao = precificar({
      servicos,
      categoria: lead.categoria,
      num_avaliacoes: lead.num_avaliacoes,
    });

    let proposta: PropostaTexto;
    try {
      proposta = await gerarPropostaLib(
        {
          nome: lead.nome,
          categoria: lead.categoria,
          dores,
          servicos,
        },
        llm,
      );
    } catch (e) {
      if (e instanceof PropostaError) {
        return { kind: "erro", mensagem: e.message };
      }
      return {
        kind: "erro",
        mensagem: "Falha ao gerar a Proposta. Tente novamente.",
      };
    }

    const textoCopiavel = formatarPropostaTexto(proposta, precificacao);
    const salva = await persistirProposta({
      userId,
      leadId: lead.id,
      oportunidadeId,
      proposta,
      precificacao,
      textoCopiavel,
    });

    await consumirCota(userId, "proposta");

    return {
      kind: "ok",
      propostaId: salva.id,
      versao: salva.versao,
      proposta,
      precificacao,
      textoCopiavel,
    };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
