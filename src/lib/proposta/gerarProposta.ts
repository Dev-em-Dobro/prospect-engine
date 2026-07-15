// F012 — Geração da prosa da Proposta via Claude API (SDK oficial).
// Contrato: /specs/03-contracts/claude-messages.md · Decisão: ADR-005.
// A IA escreve só o texto; o preço vem de precos.ts. Lança PropostaError;
// quem traduz pra UI é a Server Action.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import {
  SYSTEM_PROMPT_PROPOSTA,
  montarContextoProposta,
  type ContextoProposta,
} from "./prompt";

export class PropostaError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "PropostaError";
  }
}

export type EscopoItem = { item: string; descricao: string };

export type PropostaTexto = {
  resumo: string;
  escopo: EscopoItem[];
  entregaveis: string[];
  prazo_estimado: string;
  observacoes: string;
};

const PROPOSTA_FORMAT = jsonSchemaOutputFormat({
  type: "object",
  properties: {
    resumo: { type: "string" },
    escopo: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          descricao: { type: "string" },
        },
        required: ["item", "descricao"],
        additionalProperties: false,
      },
    },
    entregaveis: { type: "array", items: { type: "string" } },
    prazo_estimado: { type: "string" },
    observacoes: { type: "string" },
  },
  required: ["resumo", "escopo", "entregaveis", "prazo_estimado", "observacoes"],
  additionalProperties: false,
});

/** Gera a prosa da Proposta (sem preço) para um Lead. */
export async function gerarProposta(
  ctx: ContextoProposta,
  apiKey: string,
): Promise<PropostaTexto> {
  if (!apiKey) {
    throw new PropostaError(
      0,
      "Anthropic (IA) não configurada — configure em /configuracao",
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const res = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT_PROPOSTA,
      messages: [{ role: "user", content: montarContextoProposta(ctx) }],
      output_config: { format: PROPOSTA_FORMAT },
    });

    const out = res.parsed_output as PropostaTexto | null;
    if (!out) {
      // parsed_output nulo: refusal, max_tokens, etc.
      throw new PropostaError(200, "Claude não retornou uma proposta válida");
    }
    return out;
  } catch (e) {
    if (e instanceof PropostaError) throw e;
    if (e instanceof Anthropic.APIError) {
      throw new PropostaError(e.status ?? 0, e.message);
    }
    throw e;
  }
}
