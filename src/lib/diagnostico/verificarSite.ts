// F002 — verificação do site do Lead.
// Regras em /specs/02-features/F002-diagnostico-de-presenca-digital.md:
// GET com timeout de 10s, seguindo até 5 redirects manualmente (pra
// conhecer a URL final e decidir tem_https). Status >= 400, timeout ou
// erro de rede ⇒ site não resolve.

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

export type ResultadoSite =
  | { temSite: true; urlFinal: string; temHttps: boolean; tempoMs: number }
  | { temSite: false };

export async function verificarSite(url: string): Promise<ResultadoSite> {
  const inicio = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let urlAtual = url;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      const res = await fetch(urlAtual, {
        redirect: "manual",
        signal: controller.signal,
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        await res.body?.cancel();
        if (!location) {
          return { temSite: false };
        }
        urlAtual = new URL(location, urlAtual).toString();
        continue;
      }

      if (res.status >= 400) {
        return { temSite: false };
      }

      // Consome o corpo pra que tempoMs cubra o carregamento completo
      // do HTML, não só os headers.
      await res.arrayBuffer();

      return {
        temSite: true,
        urlFinal: urlAtual,
        temHttps: new URL(urlAtual).protocol === "https:",
        tempoMs: Math.round(performance.now() - inicio),
      };
    }

    // Excedeu MAX_REDIRECTS sem chegar a uma resposta final.
    return { temSite: false };
  } catch {
    // Timeout (abort), DNS, TLS, URL inválida etc.
    return { temSite: false };
  } finally {
    clearTimeout(timer);
  }
}
