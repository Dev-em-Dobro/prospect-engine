// F012 — Dor (do Diagnóstico) → Serviço a propor. Função pura, testável isolada.
// Spec: /specs/02-features/F012-gerador-de-proposta.md

export type Servico =
  | "CRIACAO_SITE"
  | "OTIMIZACAO_PERFORMANCE"
  | "SSL_SEGURANCA"
  | "PRESENCA_BASE";

export const SERVICO_LABEL: Record<Servico, string> = {
  CRIACAO_SITE: "Criação de site institucional",
  OTIMIZACAO_PERFORMANCE: "Otimização de performance (velocidade no celular)",
  SSL_SEGURANCA: "Certificado SSL / HTTPS",
  PRESENCA_BASE: "Melhorias de presença e conversão",
};

export type DiagnosticoParaServicos = {
  tem_site: boolean;
  site_e_agregador: boolean;
  tem_https: boolean | null;
  performance_mobile: number | null;
};

/** Serviços recomendados a partir do último Diagnóstico. */
export function servicosRecomendados(diag: DiagnosticoParaServicos): Servico[] {
  // Sem site próprio (ou só agregador): o serviço É o site — não empilha.
  if (!diag.tem_site || diag.site_e_agregador) return ["CRIACAO_SITE"];

  const servicos: Servico[] = [];
  if (diag.performance_mobile !== null && diag.performance_mobile < 50) {
    servicos.push("OTIMIZACAO_PERFORMANCE");
  }
  if (diag.tem_https === false) {
    servicos.push("SSL_SEGURANCA");
  }
  // Site no ar sem Dor técnica clara: propor melhorias de conversão.
  if (servicos.length === 0) servicos.push("PRESENCA_BASE");
  return servicos;
}
