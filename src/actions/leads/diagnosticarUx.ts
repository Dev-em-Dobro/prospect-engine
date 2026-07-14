"use server";

// F008 — Diagnóstico UX via IA (screenshot + visão).
// Spec: F008-diagnostico-ux-ia.md

import { z } from "zod";
import { mensagemEscopo, requireLeadOwned } from "@/lib/db/scoped";
import {
  capturarScreenshots,
  ScreenshotError,
} from "@/lib/diagnostico-ux/screenshot";
import {
  analisarUx,
  AnaliseUxError,
  type AnaliseUx,
} from "@/lib/diagnostico-ux/analisarUx";

const schema = z.object({
  lead_id: z.string().cuid("lead_id inválido"),
});

export type DiagnosticarUxState =
  | { kind: "idle" }
  | { kind: "ok"; analise: AnaliseUx }
  | { kind: "erro"; mensagem: string };

export async function diagnosticarUxAction(
  _prev: DiagnosticarUxState,
  formData: FormData,
): Promise<DiagnosticarUxState> {
  const parsed = schema.safeParse({ lead_id: formData.get("lead_id") });
  if (!parsed.success) {
    return { kind: "erro", mensagem: "Input inválido" };
  }

  // AC4: falha de configuração detectada antes de qualquer chamada.
  // (Screenshot não exige env: Playwright local é o provider default — ADR-006.)
  if (!process.env.ANTHROPIC_API_KEY) {
    return { kind: "erro", mensagem: "ANTHROPIC_API_KEY não configurada" };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { kind: "erro", mensagem: "ANTHROPIC_API_KEY não configurada" };
  }

  try {
    const { lead } = await requireLeadOwned(parsed.data.lead_id);
    if (!lead.website) {
      return {
        kind: "erro",
        mensagem: "Lead sem site — Diagnóstico UX exige website",
      };
    }

    const { desktopB64, mobileB64 } = await capturarScreenshots(lead.website);

    const analise = await analisarUx({
      nome: lead.nome,
      categoria: lead.categoria,
      desktopB64,
      mobileB64,
    });

    return { kind: "ok", analise };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    if (e instanceof ScreenshotError || e instanceof AnaliseUxError) {
      return { kind: "erro", mensagem: e.message };
    }
    return {
      kind: "erro",
      mensagem: "Falha no Diagnóstico UX. Tente novamente.",
    };
  }
}
