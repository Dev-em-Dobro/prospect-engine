"use server";

// F002 — Diagnóstico de presença digital.
// Spec: /specs/02-features/F002-diagnostico-de-presenca-digital.md

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { classificarWebsite } from "@/lib/diagnostico/agregador";
import { verificarSite } from "@/lib/diagnostico/verificarSite";
import { performanceMobile } from "@/lib/pagespeed/performanceMobile";

const schema = z.object({
  lead_id: z.string().cuid("lead_id inválido"),
});

export type DiagnosticarState =
  | { kind: "idle" }
  | { kind: "ok"; resumo: string }
  | { kind: "erro"; mensagem: string };

export async function diagnosticarLead(
  _prev: DiagnosticarState,
  formData: FormData,
): Promise<DiagnosticarState> {
  const parsed = schema.safeParse({ lead_id: formData.get("lead_id") });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "lead_id inválido" };
  }

  // AC7: falha de configuração é detectada antes de qualquer chamada.
  if (!process.env.PAGESPEED_API_KEY) {
    return { kind: "erro", mensagem: "PAGESPEED_API_KEY não configurada" };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: parsed.data.lead_id },
  });
  if (!lead) {
    return { kind: "erro", mensagem: "Lead não encontrado" };
  }

  let tem_site = false;
  let site_e_agregador = false;
  let tem_https: boolean | null = null;
  let tempo_carregamento_ms: number | null = null;
  let performance_mobile: number | null = null;

  if (lead.website) {
    // F009: se o website é Agregador link-in-bio ou perfil social, não é site
    // próprio. Não chama verificarSite nem o PSI — medir um Linktree não tem
    // valor e a Necessidade (F003) já será máxima.
    const classif = classificarWebsite(lead.website);
    if (classif.ehAgregador) {
      tem_site = true;
      site_e_agregador = true;
      tem_https = classif.temHttps;
    } else {
      const site = await verificarSite(lead.website);
      if (site.temSite) {
        tem_site = true;
        tem_https = site.temHttps;
        tempo_carregamento_ms = site.tempoMs;
        try {
          performance_mobile = await performanceMobile(site.urlFinal);
        } catch {
          // Falha do PSI degrada pra null, nunca aborta o Diagnóstico.
          performance_mobile = null;
        }
      }
    }
  }

  await prisma.$transaction([
    prisma.diagnostico.create({
      data: {
        lead_id: lead.id,
        tem_site,
        site_e_agregador,
        tem_https,
        tempo_carregamento_ms,
        performance_mobile,
      },
    }),
    // Só `novo` transiciona — re-diagnóstico não regride o funil.
    ...(lead.status === "novo"
      ? [
          prisma.lead.update({
            where: { id: lead.id },
            data: { status: "enriquecido" },
          }),
        ]
      : []),
  ]);

  revalidatePath("/leads");

  const resumo = !lead.website
    ? "sem site"
    : site_e_agregador
      ? "presença só em agregador/rede social — sem site próprio"
      : !tem_site
        ? "site fora do ar"
        : [
            "site ok",
            tem_https ? "HTTPS ok" : "sem HTTPS",
            performance_mobile === null
              ? "performance indisponível"
              : `performance mobile ${performance_mobile}`,
          ].join(" · ");

  return { kind: "ok", resumo: `Diagnóstico concluído: ${resumo}.` };
}
