// F002 — verificação do site do Lead.
// Regras em /specs/02-features/F002-diagnostico-de-presenca-digital.md:
// GET com timeout de 10s, seguindo até 5 redirects manualmente (pra
// conhecer a URL final e decidir tem_https). Status >= 400, timeout ou
// erro de rede ⇒ site não resolve.
// SSRF: só http(s), host público (sem IPs privados/metadata).

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

export type ResultadoSite =
  | { temSite: true; urlFinal: string; temHttps: boolean; tempoMs: number }
  | { temSite: false };

function ipPrivadoOuLocal(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "0.0.0.0") return true;
  if (v.startsWith("127.") || v.startsWith("10.")) return true;
  if (v.startsWith("192.168.")) return true;
  if (v.startsWith("169.254.")) return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
  const m = /^172\.(\d+)\./.exec(v);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  // link-local / metadata comuns
  if (v === "169.254.169.254" || v === "metadata.google.internal") return true;
  return false;
}

function hostnameProibido(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h === "metadata.google.internal"
  ) {
    return true;
  }
  if (isIP(h) && ipPrivadoOuLocal(h)) return true;
  return false;
}

/** Valida URL antes do fetch (protocolo + host + DNS → IP público). */
export async function urlPermitidaParaFetch(urlStr: string): Promise<boolean> {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  if (u.port && u.port !== "80" && u.port !== "443" && u.port !== "") {
    return false;
  }
  if (hostnameProibido(u.hostname)) return false;

  if (isIP(u.hostname)) {
    return !ipPrivadoOuLocal(u.hostname);
  }

  try {
    const records = await lookup(u.hostname, { all: true });
    if (records.length === 0) return false;
    return records.every((r) => !ipPrivadoOuLocal(r.address));
  } catch {
    return false;
  }
}

export async function verificarSite(url: string): Promise<ResultadoSite> {
  const inicio = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let urlAtual = url;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      if (!(await urlPermitidaParaFetch(urlAtual))) {
        return { temSite: false };
      }

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
