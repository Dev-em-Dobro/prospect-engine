"use server";

// F013 — uma rodada do Simulador de Venda. Spec: F013-simulador-de-venda.md.
// Stateless: recebe cenário + histórico do client, devolve a fala do dono.
// Não persiste nada.

import { entradaSchema } from "@/lib/simulador/validacao";
import { simularTurno, SimuladorError } from "@/lib/simulador/simular";

export type ResponderTurnoResult =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string };

export async function responderTurnoAction(
  input: unknown,
): Promise<ResponderTurnoResult> {
  const parsed = entradaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Input inválido" };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, erro: "ANTHROPIC_API_KEY não configurada" };
  }

  const { cenario, historico } = parsed.data;
  const ultimo = historico[historico.length - 1];
  if (!ultimo || ultimo.papel !== "aluno") {
    return { ok: false, erro: "Aguardando a fala do treinando" };
  }

  try {
    const { mensagem } = await simularTurno(cenario, historico);
    return { ok: true, mensagem };
  } catch (e) {
    if (e instanceof SimuladorError) return { ok: false, erro: e.message };
    return { ok: false, erro: "Falha na simulação. Tente novamente." };
  }
}
