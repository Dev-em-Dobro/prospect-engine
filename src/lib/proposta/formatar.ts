// F012 — Formatação de exibição da Proposta. Puro, sem dependência de Next
// (importado por lib, Server Action e UI).

import type { PropostaTexto } from "./gerarProposta";
import type { Precificacao } from "./precos";

/** 2400 → "2.400" (separador de milhar pt-BR, sem depender de ICU). */
export function milhar(v: number): string {
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function faixaBRL(p: Precificacao): string {
  return `R$ ${milhar(p.faixa_min)} – R$ ${milhar(p.faixa_max)}`;
}

/** Texto plano pra colar no WhatsApp: prosa da IA + a linha de preço do cálculo. */
export function formatarPropostaTexto(
  proposta: PropostaTexto,
  precificacao: Precificacao,
): string {
  const linhas = [
    `Proposta — ${proposta.resumo}`,
    "",
    "Escopo:",
    ...proposta.escopo.map((e) => `- ${e.item}: ${e.descricao}`),
    "",
    "Você recebe:",
    ...proposta.entregaveis.map((e) => `- ${e}`),
    "",
    `Prazo estimado: ${proposta.prazo_estimado}`,
    `Investimento sugerido: ${faixaBRL(precificacao)}`,
  ];
  if (proposta.observacoes.trim()) {
    linhas.push("", proposta.observacoes.trim());
  }
  return linhas.join("\n");
}
