// F008 — análise de UX dos screenshots via Claude API (visão).
// Spec: /specs/02-features/F008-diagnostico-ux-ia.md · Padrão SDK: ADR-005.
// Lança AnaliseUxError; quem traduz pra UI é a Server Action.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import type { Severidade } from "@prisma/client";

export class AnaliseUxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnaliseUxError";
  }
}

export type ProblemaUx = {
  titulo: string;
  severidade: Severidade;
  detalhe: string;
};

export type AnaliseUx = {
  resumo: string;
  problemas: ProblemaUx[];
  pontos_positivos: string[];
};

export type ContextoAnalise = {
  nome: string;
  categoria: string;
  /** Screenshots JPEG em base64. */
  desktopB64: string;
  mobileB64: string;
};

const ANALISE_FORMAT = jsonSchemaOutputFormat({
  type: "object",
  properties: {
    resumo: { type: "string" },
    problemas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          severidade: { type: "string", enum: ["ALTA", "MEDIA", "BAIXA"] },
          detalhe: { type: "string" },
        },
        required: ["titulo", "severidade", "detalhe"],
        additionalProperties: false,
      },
    },
    pontos_positivos: { type: "array", items: { type: "string" } },
  },
  required: ["resumo", "problemas", "pontos_positivos"],
  additionalProperties: false,
});

const SYSTEM = `Você é um consultor sênior de UX/UI avaliando o site de um estabelecimento local. A primeira imagem é o site em desktop (1280×800) e a segunda em mobile (390×844) — apenas a dobra inicial de cada um.

Sua análise vira um diagnóstico gratuito enviado ao dono do negócio. Regras:
- Reporte APENAS o que está visível nos screenshots. Nunca invente nada.
- Linguagem simples de dono de negócio, sem jargão técnico.
- Foco em conversão: o visitante entende na hora o que o negócio faz? Encontra contato/WhatsApp fácil? O site transmite confiança e profissionalismo? A versão mobile funciona bem?
- "resumo": 2–3 frases com a impressão geral.
- "problemas": 3 a 6, ordenados da maior pra menor severidade.
- "pontos_positivos": até 3, sinceros (lista vazia se não houver).`;

/** Analisa os screenshots do site de um Lead e retorna o diagnóstico de UX. */
export async function analisarUx(ctx: ContextoAnalise): Promise<AnaliseUx> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AnaliseUxError("ANTHROPIC_API_KEY não configurada");
  }

  const client = new Anthropic();

  try {
    const res = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      thinking: { type: "disabled" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: ctx.desktopB64,
              },
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: ctx.mobileB64,
              },
            },
            {
              type: "text",
              text: `Estabelecimento: ${ctx.nome} (${ctx.categoria}). Analise o site nos dois screenshots.`,
            },
          ],
        },
      ],
      output_config: { format: ANALISE_FORMAT },
    });

    const out = res.parsed_output as AnaliseUx | null;
    if (!out) {
      throw new AnaliseUxError("Claude não retornou uma análise válida");
    }
    return out;
  } catch (e) {
    if (e instanceof AnaliseUxError) throw e;
    if (e instanceof Anthropic.APIError) {
      throw new AnaliseUxError(`Claude API: ${e.message}`);
    }
    throw e;
  }
}
