// F007 — Geração de Ideias de Vídeo via Claude API (SDK oficial).
// Contrato: /specs/03-contracts/claude-messages.md · Decisão: ADR-005.
// Lança ConteudoError; quem traduz pra UI é a Server Action.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import {
  SYSTEM_PROMPT_CONTEUDO,
  montarTema,
  type IdeiaVideo,
} from "./prompt";

export class ConteudoError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ConteudoError";
  }
}

const IDEIAS_FORMAT = jsonSchemaOutputFormat({
  type: "object",
  properties: {
    ideias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          formato: { type: "string" },
          atrai: { type: "string" },
          etapa: { type: "string", enum: ["topo", "meio", "fundo"] },
          cta: { type: "string" },
          roteiro: { type: "array", items: { type: "string" } },
        },
        required: ["titulo", "formato", "atrai", "etapa", "cta", "roteiro"],
        additionalProperties: false,
      },
    },
  },
  required: ["ideias"],
  additionalProperties: false,
});

/** Gera Ideias de Vídeo-Funil a partir de um tema. */
export async function sugerirVideos(tema: string): Promise<IdeiaVideo[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ConteudoError(0, "ANTHROPIC_API_KEY não configurada");
  }

  const client = new Anthropic();

  try {
    const res = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT_CONTEUDO,
      messages: [{ role: "user", content: montarTema(tema) }],
      output_config: { format: IDEIAS_FORMAT },
    });

    const out = res.parsed_output;
    if (!out) {
      throw new ConteudoError(200, "Claude não retornou ideias válidas");
    }

    return out.ideias.map((i) => ({
      titulo: i.titulo,
      formato: i.formato,
      atrai: i.atrai,
      etapa: i.etapa as IdeiaVideo["etapa"],
      cta: i.cta,
      roteiro: i.roteiro,
    }));
  } catch (e) {
    if (e instanceof ConteudoError) throw e;
    if (e instanceof Anthropic.APIError) {
      throw new ConteudoError(e.status ?? 0, e.message);
    }
    throw e;
  }
}
