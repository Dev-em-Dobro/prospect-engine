// F021 — estágios do pipeline (colunas do board).

import type { EstagioOportunidade } from "@prisma/client";

/** Colunas ativas no board MVP (sem recorrência). */
export const ESTAGIOS_BOARD: EstagioOportunidade[] = [
  "novo",
  "abordado",
  "qualificando",
  "proposta",
  "fechado",
  "producao",
  "entregue",
];

export const LABEL_ESTAGIO: Record<EstagioOportunidade, string> = {
  novo: "Novo lead",
  abordado: "Abordado",
  qualificando: "Qualificando",
  proposta: "Proposta",
  fechado: "Fechado",
  producao: "Produção",
  entregue: "Entregue",
  recorrencia: "Recorrência",
};

export function isEstagioBoard(e: EstagioOportunidade): boolean {
  return ESTAGIOS_BOARD.includes(e);
}
