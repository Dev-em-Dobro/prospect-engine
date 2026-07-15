// F013 — uma rodada do roleplay via Claude API (SDK oficial).
// A persona (dono) responde à última fala do treinando. Turno conversacional
// (sem structured output). Modelo Haiku (muitos turnos curtos, barato/rápido).
// Contrato: /specs/03-contracts/claude-messages.md · Decisão: ADR-005.

import Anthropic from "@anthropic-ai/sdk";
import { MAX_TURNOS } from "./constantes";
import { systemPromptPersona, type Cenario, type Turno } from "./prompt";

export class SimuladorError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "SimuladorError";
  }
}

/** A persona (dono) responde à última fala do treinando. */
export async function simularTurno(
  cenario: Cenario,
  historico: Turno[],
  apiKey: string,
): Promise<{ mensagem: string }> {
  if (!apiKey) {
    throw new SimuladorError(
      0,
      "Anthropic (IA) não configurada — configure em /configuracao",
    );
  }

  const turnosAluno = historico.filter((t) => t.papel === "aluno").length;
  const encerrando = turnosAluno >= MAX_TURNOS;

  // O treinando é o "user"; a persona (dono) é o "assistant".
  const messages = historico.map((t) => ({
    role: (t.papel === "aluno" ? "user" : "assistant") as "user" | "assistant",
    content: t.texto,
  }));

  const client = new Anthropic({ apiKey });

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      thinking: { type: "disabled" },
      system: systemPromptPersona(cenario, encerrando),
      messages,
    });

    const texto = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    if (!texto) {
      throw new SimuladorError(200, "Claude não retornou resposta");
    }
    return { mensagem: texto };
  } catch (e) {
    if (e instanceof SimuladorError) throw e;
    if (e instanceof Anthropic.APIError) {
      throw new SimuladorError(e.status ?? 0, e.message);
    }
    throw e;
  }
}
