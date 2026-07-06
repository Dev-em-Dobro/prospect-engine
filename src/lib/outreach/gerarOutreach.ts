// F005/F006 — Geração da Outreach via Claude API (SDK oficial).
// Contrato: /specs/03-contracts/claude-messages.md · Decisão: ADR-005.
// Lança OutreachError; quem traduz pra UI é a Server Action.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import {
  systemPrompt,
  montarContexto,
  type ContextoLead,
  type TipoOutreach,
} from "./prompt";

export class OutreachError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "OutreachError";
  }
}

// Structured output via JSON Schema (desacoplado do zod do projeto — o helper
// zod do SDK exige zod v4; este não exige nada). Garante saída `{ mensagem }`.
const OUTREACH_FORMAT = jsonSchemaOutputFormat({
  type: "object",
  properties: { mensagem: { type: "string" } },
  required: ["mensagem"],
  additionalProperties: false,
});

/** Gera a mensagem de Outreach de WhatsApp para um Lead. */
export async function gerarOutreach(
  ctx: ContextoLead,
  tipo: TipoOutreach = "primeira",
): Promise<{ mensagem: string }> {
  // Falha de configuração antes de qualquer chamada (padrão F001/F002).
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new OutreachError(0, "ANTHROPIC_API_KEY não configurada");
  }

  const client = new Anthropic();

  try {
    const res = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      system: systemPrompt(tipo),
      messages: [{ role: "user", content: montarContexto(ctx) }],
      output_config: { format: OUTREACH_FORMAT },
    });

    const out = res.parsed_output;
    if (!out) {
      // parsed_output nulo: refusal, max_tokens, etc. Não persistir.
      throw new OutreachError(200, "Claude não retornou uma mensagem válida");
    }

    return { mensagem: out.mensagem.trim() };
  } catch (e) {
    if (e instanceof OutreachError) throw e;
    if (e instanceof Anthropic.APIError) {
      throw new OutreachError(e.status ?? 0, e.message);
    }
    throw e;
  }
}
