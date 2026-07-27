import { describe, expect, it } from "vitest";
import { lerArquivoEntregavel } from "@/lib/entregaveis/servir";

describe("entregaveis servir", () => {
  it("bloqueia path traversal", async () => {
    const res = await lerArquivoEntregavel(["..", "package.json"]);
    expect(res).toBeNull();
  });

  it("lê index do arsenal", async () => {
    const res = await lerArquivoEntregavel(["01-SITES-PRONTOS", "index.html"]);
    expect(res).not.toBeNull();
    expect(res?.contentType).toContain("text/html");
    expect(res?.body.length).toBeGreaterThan(1000);
  });
});
