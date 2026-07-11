// F013 — avaliação final (Scorecard) do roleplay via Claude API.
// Structured output. Modelo Opus (uma chamada; qualidade do feedback importa).
// Contrato: /specs/03-contracts/claude-messages.md · Decisão: ADR-005.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import {
  SYSTEM_PROMPT_AVALIACAO,
  montarTranscript,
  type Cenario,
  type Turno,
} from "./prompt";
import { SimuladorError } from "./simular";

export type Competencia = { nome: string; nota: number; comentario: string };

export type Scorecard = {
  competencias: Competencia[];
  nota_geral: number;
  pontos_fortes: string[];
  o_que_melhorar: string[];
};

const AVALIACAO_FORMAT = jsonSchemaOutputFormat({
  type: "object",
  properties: {
    competencias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          nota: { type: "number" },
          comentario: { type: "string" },
        },
        required: ["nome", "nota", "comentario"],
        additionalProperties: false,
      },
    },
    nota_geral: { type: "number" },
    pontos_fortes: { type: "array", items: { type: "string" } },
    o_que_melhorar: { type: "array", items: { type: "string" } },
  },
  required: ["competencias", "nota_geral", "pontos_fortes", "o_que_melhorar"],
  additionalProperties: false,
});

/** Avalia a conversa e devolve o Scorecard do treinando. */
export async function avaliarSimulacao(
  cenario: Cenario,
  historico: Turno[],
): Promise<Scorecard> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new SimuladorError(0, "ANTHROPIC_API_KEY não configurada");
  }

  const client = new Anthropic();

  try {
    const res = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT_AVALIACAO,
      messages: [
        { role: "user", content: montarTranscript(cenario, historico) },
      ],
      output_config: { format: AVALIACAO_FORMAT },
    });

    const out = res.parsed_output as Scorecard | null;
    if (!out) {
      throw new SimuladorError(200, "Claude não retornou uma avaliação válida");
    }
    return out;
  } catch (e) {
    if (e instanceof SimuladorError) throw e;
    if (e instanceof Anthropic.APIError) {
      throw new SimuladorError(e.status ?? 0, e.message);
    }
    throw e;
  }
}
