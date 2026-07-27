// F021 — playbook padrão (seed de tarefas por estágio).

import type { EstagioOportunidade } from "@prisma/client";

export type PlaybookItem = {
  estagio: EstagioOportunidade;
  titulo: string;
  /** Slug F020 ou null. */
  entregavel_slug: string | null;
  ordem: number;
};

/**
 * Checklist semeada ao criar Oportunidade.
 * Slugs = catálogo F020 (`/entregaveis/{slug}`).
 */
export const PLAYBOOK_PADRAO: PlaybookItem[] = [
  // NOVO
  {
    estagio: "novo",
    titulo: "Conferir o negócio (Instagram, WhatsApp, tem site?)",
    entregavel_slug: null,
    ordem: 10,
  },
  {
    estagio: "novo",
    titulo: "Definir se é lista quente (conhecido) ou fria (Orion)",
    entregavel_slug: null,
    ordem: 20,
  },
  // ABORDADO
  {
    estagio: "abordado",
    titulo: "Enviar mensagem de abertura",
    entregavel_slug: "scripts-venda",
    ordem: 30,
  },
  {
    estagio: "abordado",
    titulo: "Registrar a resposta (nota)",
    entregavel_slug: null,
    ordem: 40,
  },
  {
    estagio: "abordado",
    titulo: "Follow-up se não respondeu em 1–2 dias",
    entregavel_slug: "scripts-venda",
    ordem: 50,
  },
  // QUALIFICANDO
  {
    estagio: "qualificando",
    titulo: "Fazer perguntas de qualificação",
    entregavel_slug: "scripts-venda",
    ordem: 60,
  },
  {
    estagio: "qualificando",
    titulo: "Mostrar o problema (diagnóstico)",
    entregavel_slug: "scripts-venda",
    ordem: 70,
  },
  {
    estagio: "qualificando",
    titulo: "Definir a oferta (site / bot / melhoria / sistema)",
    entregavel_slug: null,
    ordem: 80,
  },
  // PROPOSTA
  {
    estagio: "proposta",
    titulo: "Montar prévia visual (mockup)",
    entregavel_slug: "arsenal-sites",
    ordem: 90,
  },
  {
    estagio: "proposta",
    titulo: "Apresentar valor antes do preço",
    entregavel_slug: "scripts-venda",
    ordem: 100,
  },
  {
    estagio: "proposta",
    titulo: "Enviar preço (3 opções)",
    entregavel_slug: "precificacao",
    ordem: 110,
  },
  {
    estagio: "proposta",
    titulo: "Contornar objeção",
    entregavel_slug: "scripts-venda",
    ordem: 120,
  },
  // FECHADO
  {
    estagio: "fechado",
    titulo: "Enviar contrato + Pix do sinal (30%)",
    entregavel_slug: "contrato",
    ordem: 130,
  },
  {
    estagio: "fechado",
    titulo: "Confirmar sinal pago",
    entregavel_slug: null,
    ordem: 140,
  },
  {
    estagio: "fechado",
    titulo: "Registrar valor fechado no card",
    entregavel_slug: null,
    ordem: 150,
  },
  // PRODUÇÃO
  {
    estagio: "producao",
    titulo: "Enviar briefing / levantar requisitos",
    entregavel_slug: "briefing",
    ordem: 160,
  },
  {
    estagio: "producao",
    titulo: "Construir o projeto",
    entregavel_slug: "prompts",
    ordem: 170,
  },
  {
    estagio: "producao",
    titulo: "Publicar e colocar o crédito no rodapé",
    entregavel_slug: "portfolio",
    ordem: 180,
  },
  {
    estagio: "producao",
    titulo: "Enviar o link no ar pro cliente",
    entregavel_slug: "scripts-venda",
    ordem: 190,
  },
  // ENTREGUE
  {
    estagio: "entregue",
    titulo: "Entregar + pedir feedback",
    entregavel_slug: "scripts-venda",
    ordem: 200,
  },
  {
    estagio: "entregue",
    titulo: "Marcar como ganho",
    entregavel_slug: null,
    ordem: 210,
  },
  // RECORRÊNCIA (sem coluna no board; tarefas disponíveis no detalhe)
  {
    estagio: "recorrencia",
    titulo: "Oferecer manutenção mensal",
    entregavel_slug: "precificacao",
    ordem: 220,
  },
  {
    estagio: "recorrencia",
    titulo: "Pedir indicação",
    entregavel_slug: "scripts-venda",
    ordem: 230,
  },
];

export function urlEntregavel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return `/entregaveis/${slug}`;
}
