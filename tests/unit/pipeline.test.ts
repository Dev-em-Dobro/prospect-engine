import { describe, expect, it } from "vitest";
import {
  PLAYBOOK_PADRAO,
  calcularMetricas,
  percentualTarefasEstagio,
  urlEntregavel,
} from "@/lib/pipeline";

describe("pipeline playbook F021", () => {
  it("semeia tarefas em todos os estágios principais", () => {
    expect(PLAYBOOK_PADRAO.length).toBeGreaterThanOrEqual(20);
    const estagios = new Set(PLAYBOOK_PADRAO.map((p) => p.estagio));
    expect(estagios.has("novo")).toBe(true);
    expect(estagios.has("abordado")).toBe(true);
    expect(estagios.has("proposta")).toBe(true);
    expect(estagios.has("fechado")).toBe(true);
    expect(estagios.has("producao")).toBe(true);
    expect(estagios.has("entregue")).toBe(true);
  });

  it("ordena tarefas crescente", () => {
    const ordens = PLAYBOOK_PADRAO.map((p) => p.ordem);
    expect([...ordens].sort((a, b) => a - b)).toEqual(ordens);
  });

  it("urlEntregavel monta path F020", () => {
    expect(urlEntregavel("scripts-venda")).toBe("/entregaveis/scripts-venda");
    expect(urlEntregavel(null)).toBeNull();
  });
});

describe("pipeline metricas F021", () => {
  it("soma faturamento só de won", () => {
    const m = calcularMetricas([
      { estagio: "novo", status: "open", valor: null },
      { estagio: "fechado", status: "won", valor: 1500 },
      { estagio: "proposta", status: "lost", valor: 900 },
      { estagio: "entregue", status: "won", valor: { toNumber: () => 500 } },
    ]);
    expect(m.ganhos).toBe(2);
    expect(m.perdidos).toBe(1);
    expect(m.faturamentoFechado).toBe(2000);
    expect(m.porEstagio.novo).toBe(1);
  });

  it("percentualTarefasEstagio", () => {
    expect(
      percentualTarefasEstagio(
        [
          { estagio: "abordado", concluida: true },
          { estagio: "abordado", concluida: false },
          { estagio: "novo", concluida: true },
        ],
        "abordado",
      ),
    ).toBe(50);
    expect(percentualTarefasEstagio([], "novo")).toBe(0);
  });
});
