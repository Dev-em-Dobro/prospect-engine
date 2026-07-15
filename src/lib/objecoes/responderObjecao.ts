// F011 — Geração das respostas a objeções via Claude API (SDK oficial).
// Contrato: /specs/03-contracts/claude-messages.md · Decisão: ADR-005.
// Lança ObjecaoError; quem traduz pra UI é a Server Action.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import {
  SYSTEM_PROMPT_OBJECOES,
  montarContextoObjecao,
  type ContextoObjecao,
} from "./prompt";

export class ObjecaoError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ObjecaoError";
  }
}

export type RespostaObjecao = { abordagem: string; texto: string };

const OBJECAO_FORMAT = jsonSchemaOutputFormat({
  type: "object",
  properties: {
    respostas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          abordagem: { type: "string" },
          texto: { type: "string" },
        },
        required: ["abordagem", "texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["respostas"],
  additionalProperties: false,
});

/** Gera 2–3 respostas sugeridas para a objeção do Lead. */
export async function responderObjecao(
  ctx: ContextoObjecao,
  apiKey: string,
): Promise<{ respostas: RespostaObjecao[] }> {
  if (!apiKey) {
    throw new ObjecaoError(
      0,
      "Anthropic (IA) não configurada — configure em /configuracao",
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const res = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT_OBJECOES,
      messages: [{ role: "user", content: montarContextoObjecao(ctx) }],
      output_config: { format: OBJECAO_FORMAT },
    });

    const out = res.parsed_output as { respostas: RespostaObjecao[] } | null;
    if (!out) {
      // parsed_output nulo: refusal, max_tokens, etc.
      throw new ObjecaoError(200, "Claude não retornou respostas válidas");
    }
    return out;
  } catch (e) {
    if (e instanceof ObjecaoError) throw e;
    if (e instanceof Anthropic.APIError) {
      throw new ObjecaoError(e.status ?? 0, e.message);
    }
    throw e;
  }
}
