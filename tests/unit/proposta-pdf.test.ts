import { describe, expect, it } from "vitest";
import {
  quebrarLinhas,
  montarPdfProposta,
  paraWinAnsi,
} from "@/lib/proposta/pdf";

describe("F022 pdf", () => {
  it("quebra linhas longas", () => {
    const long = "a".repeat(200);
    const linhas = quebrarLinhas(long, 90);
    expect(linhas.every((l) => l.length <= 90)).toBe(true);
    expect(linhas.join("").replace(/\s/g, "").length).toBe(200);
  });

  it("preserva linhas vazias", () => {
    expect(quebrarLinhas("a\n\nb")).toEqual(["a", "", "b"]);
  });

  it("paraWinAnsi troca traços tipográficos por hífen", () => {
    expect(paraWinAnsi("Proposta — resumo")).toBe("Proposta - resumo");
    expect(paraWinAnsi("R$ 1.050 – R$ 1.950")).toBe("R$ 1.050 - R$ 1.950");
    expect(paraWinAnsi("captação e presença")).toBe("captação e presença");
  });

  it("monta PDF com bytes %PDF e layout estruturado", async () => {
    const bytes = await montarPdfProposta({
      nomeNegocio: "Barbearia Teste",
      resumo: "Proposta — resumo com acentos: captação e presença.",
      escopo: [{ item: "Site", descricao: "do zero" }],
      entregaveis: ["Landing page"],
      prazoEstimado: "2 a 3 semanas",
      faixaMin: 1050,
      faixaMax: 1950,
      observacoes: "Próximos passos alinhados.",
    });
    const head = String.fromCharCode(...bytes.slice(0, 4));
    expect(head).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
