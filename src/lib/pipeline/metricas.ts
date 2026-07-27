// F021 — métricas do mini painel do pipeline.

import type { EstagioOportunidade, StatusOportunidade } from "@prisma/client";
import { ESTAGIOS_BOARD } from "./estagios";

export type ContadoresPipeline = {
  porEstagio: Record<EstagioOportunidade, number>;
  ganhos: number;
  perdidos: number;
  /** Soma dos valores com status=won (em reais). */
  faturamentoFechado: number;
};

type RowMetrica = {
  estagio: EstagioOportunidade;
  status: StatusOportunidade;
  valor: { toNumber(): number } | number | null;
};

export function calcularMetricas(rows: RowMetrica[]): ContadoresPipeline {
  const porEstagio = Object.fromEntries(
    ESTAGIOS_BOARD.map((e) => [e, 0]),
  ) as Record<EstagioOportunidade, number>;
  // recorrencia fora do board, mas tipagem completa:
  porEstagio.recorrencia = 0;

  let ganhos = 0;
  let perdidos = 0;
  let faturamentoFechado = 0;

  for (const row of rows) {
    if (row.status === "lost") {
      perdidos += 1;
      continue;
    }
    if (row.status === "won") {
      ganhos += 1;
      const v =
        row.valor == null
          ? 0
          : typeof row.valor === "number"
            ? row.valor
            : row.valor.toNumber();
      faturamentoFechado += v;
    }
    if (row.status === "open" || row.status === "won") {
      if (row.estagio in porEstagio) {
        porEstagio[row.estagio] += 1;
      }
    }
  }

  return { porEstagio, ganhos, perdidos, faturamentoFechado };
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
