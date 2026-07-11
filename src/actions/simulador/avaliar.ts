"use server";

// F013 — avaliação final (Scorecard) do Simulador de Venda.
// Spec: F013-simulador-de-venda.md. Stateless, não persiste.

import { entradaSchema } from "@/lib/simulador/validacao";
import { avaliarSimulacao } from "@/lib/simulador/avaliar";
import { SimuladorError } from "@/lib/simulador/simular";
import type { Scorecard } from "@/lib/simulador/avaliar";

export type AvaliarResult =
  | { ok: true; scorecard: Scorecard }
  | { ok: false; erro: string };

export async function avaliarSimulacaoAction(
  input: unknown,
): Promise<AvaliarResult> {
  const parsed = entradaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Input inválido" };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, erro: "ANTHROPIC_API_KEY não configurada" };
  }

  const { cenario, historico } = parsed.data;
  const turnosAluno = historico.filter((t) => t.papel === "aluno").length;
  if (turnosAluno < 2) {
    return { ok: false, erro: "Converse um pouco antes de avaliar" };
  }

  try {
    const scorecard = await avaliarSimulacao(cenario, historico);
    return { ok: true, scorecard };
  } catch (e) {
    if (e instanceof SimuladorError) return { ok: false, erro: e.message };
    return { ok: false, erro: "Falha na avaliação. Tente novamente." };
  }
}
