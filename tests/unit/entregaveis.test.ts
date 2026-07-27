import { describe, expect, it } from "vitest";
import {
  lerArquivoEntregavel,
  sanitizarTextoEntregavel,
} from "@/lib/entregaveis/servir";

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

  it("remove URLs externas ao servir", () => {
    const out = sanitizarTextoEntregavel(
      'href="https://orion-lead-hunter.devemdobro.com/login" e https://entregaveis-psi.vercel.app/foo',
    );
    expect(out).not.toContain("orion-lead-hunter");
    expect(out).not.toContain("entregaveis-psi");
    expect(out).toContain('href="/"');
    expect(out).toContain("/entregaveis");
  });
});
