"use server";

// F005 — Outreach de WhatsApp · F006 — suporte a follow-up (tipo).
// Specs: F005-outreach-whatsapp.md e F006-follow-up-e-funil.md

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirChave } from "@/lib/chaves";
import { mensagemEscopo, requireTenant } from "@/lib/db/scoped";
import {
  gerarOutreach as gerarOutreachLib,
  OutreachError,
} from "@/lib/outreach/gerarOutreach";
import type { ContextoLead } from "@/lib/outreach/prompt";

const schema = z.object({
  lead_id: z.string().cuid("lead_id inválido"),
  tipo: z.enum(["primeira", "followup"]).default("primeira"),
});

export type GerarOutreachState =
  | { kind: "idle" }
  | { kind: "ok"; mensagem: string; waLink: string | null; outreachId: string }
  | { kind: "erro"; mensagem: string };

type DiagResumo = {
  tem_site: boolean;
  tem_https: boolean | null;
  performance_mobile: number | null;
};

function derivarDores(diag: DiagResumo, website: string | null): string[] {
  if (!website || !diag.tem_site) {
    return ["não tem site / presença digital própria"];
  }

  const dores: string[] = [];
  if (diag.performance_mobile !== null && diag.performance_mobile < 50) {
    dores.push(
      `site muito lento no celular (nota ${diag.performance_mobile}/100 no Google PageSpeed)`,
    );
  }
  if (diag.tem_https === false) {
    dores.push("site sem HTTPS (sem cadeado de segurança)");
  }
  return dores;
}

function linkWhatsapp(telefone: string | null, mensagem: string): string | null {
  if (!telefone) return null;
  let digitos = telefone.replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.length <= 11) digitos = `55${digitos}`;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}

export async function gerarOutreachAction(
  _prev: GerarOutreachState,
  formData: FormData,
): Promise<GerarOutreachState> {
  const parsed = schema.safeParse({
    lead_id: formData.get("lead_id"),
    tipo: formData.get("tipo") ?? undefined,
  });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Input inválido" };
  }

  try {
    const { userId } = await requireTenant();
    const anthropicKey = await exigirChave(userId, "anthropic");
    const lead = await prisma.lead.findFirst({
      where: { id: parsed.data.lead_id, user_id: userId },
      include: { diagnosticos: { orderBy: { executado_em: "desc" }, take: 1 } },
    });
    if (!lead) {
      return { kind: "erro", mensagem: "Lead não encontrado" };
    }

    const diag = lead.diagnosticos[0];
    if (!diag) {
      return {
        kind: "erro",
        mensagem: "Diagnostique o Lead antes de gerar a Outreach",
      };
    }

    const ctx: ContextoLead = {
      nome: lead.nome,
      categoria: lead.categoria,
      endereco: lead.endereco,
      dores: derivarDores(diag, lead.website),
    };

    let mensagem: string;
    try {
      ({ mensagem } = await gerarOutreachLib(
        ctx,
        anthropicKey,
        parsed.data.tipo,
      ));
    } catch (e) {
      if (e instanceof OutreachError) {
        return { kind: "erro", mensagem: e.message };
      }
      return {
        kind: "erro",
        mensagem: "Falha ao gerar a Outreach. Tente novamente.",
      };
    }

    const outreach = await prisma.outreach.create({
      data: {
        user_id: userId,
        lead_id: lead.id,
        canal: "whatsapp",
        conteudo: mensagem,
        enviado: false,
      },
    });

    revalidatePath("/leads");

    return {
      kind: "ok",
      mensagem,
      waLink: linkWhatsapp(lead.telefone, mensagem),
      outreachId: outreach.id,
    };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
