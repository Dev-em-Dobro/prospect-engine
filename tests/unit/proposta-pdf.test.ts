import { describe, expect, it } from "vitest";
import { quebrarLinhas, montarPdfProposta } from "@/lib/proposta/pdf";

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

  it("monta PDF com bytes %PDF", async () => {
    const bytes = await montarPdfProposta({
      nomeNegocio: "Barbearia Teste",
      versao: 1,
      texto: "Proposta — resumo\n\nEscopo:\n- Site: do zero",
    });
    const head = String.fromCharCode(...bytes.slice(0, 4));
    expect(head).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(100);
  });
});
