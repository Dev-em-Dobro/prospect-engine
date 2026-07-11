"use server";

// F011 — Assistente de Resposta a Objeções.
// Spec: /specs/02-features/F011-assistente-de-objecoes.md
// Assistente puro: NÃO muda status e NÃO persiste nada (padrão F008).

import { z } from "zod";
import { prisma } from "@/lib/db";
import { derivarDoDiagnostico } from "@/lib/dores/derivarDoDiagnostico";
import {
  responderObjecao as responderObjecaoLib,
  ObjecaoError,
  type RespostaObjecao,
} from "@/lib/objecoes/responderObjecao";

const schema = z.object({
  lead_id: z.string().cuid("lead_id inválido"),
  mensagem_do_lead: z
    .string()
    .trim()
    .min(2, "Cole a mensagem do Lead")
    .max(1000, "Mensagem muito longa"),
});

export type ResponderObjecaoState =
  | { kind: "idle" }
  | { kind: "ok"; respostas: RespostaObjecao[] }
  | { kind: "erro"; mensagem: string };

export async function responderObjecaoAction(
  _prev: ResponderObjecaoState,
  formData: FormData,
): Promise<ResponderObjecaoState> {
  const parsed = schema.safeParse({
    lead_id: formData.get("lead_id"),
    mensagem_do_lead: formData.get("mensagem_do_lead"),
  });
  if (!parsed.success) {
    // AC5/AC8: erro de campo específico (Zod), sem chamada externa.
    return {
      kind: "erro",
      mensagem: parsed.error.issues[0]?.message ?? "Input inválido",
    };
  }

  // AC4: falha de configuração detectada antes de qualquer chamada.
  if (!process.env.ANTHROPIC_API_KEY) {
    return { kind: "erro", mensagem: "ANTHROPIC_API_KEY não configurada" };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: parsed.data.lead_id },
    include: { diagnosticos: { orderBy: { executado_em: "desc" }, take: 1 } },
  });
  if (!lead) {
    return { kind: "erro", mensagem: "Lead não encontrado" };
  }

  const diag = lead.diagnosticos[0];
  if (!diag) {
    // AC3: sem Diagnóstico não há Dor concreta pra ancorar a resposta.
    return {
      kind: "erro",
      mensagem: "Diagnostique o Lead antes de responder objeções",
    };
  }

  const dores = derivarDoDiagnostico(diag, lead.website);

  let respostas: RespostaObjecao[];
  try {
    ({ respostas } = await responderObjecaoLib({
      nome: lead.nome,
      categoria: lead.categoria,
      dores,
      mensagemDoLead: parsed.data.mensagem_do_lead,
    }));
  } catch (e) {
    if (e instanceof ObjecaoError) {
      return { kind: "erro", mensagem: e.message };
    }
    return {
      kind: "erro",
      mensagem: "Falha ao gerar as respostas. Tente novamente.",
    };
  }

  // AC6: nada é persistido, status não muda.
  return { kind: "ok", respostas };
}
