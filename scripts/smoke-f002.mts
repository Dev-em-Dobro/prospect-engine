// Smoke test manual da F002 (sem banco): verificarSite + performanceMobile.
// Rodar: node --env-file=.env --experimental-strip-types scripts/smoke-f002.mts

import { verificarSite } from "../src/lib/diagnostico/verificarSite.ts";
import { performanceMobile } from "../src/lib/pagespeed/performanceMobile.ts";

const ok = await verificarSite("https://example.com");
console.log("site https ok:", JSON.stringify(ok));

const redirect = await verificarSite("http://google.com");
console.log("http com redirect:", JSON.stringify(redirect));

const morto = await verificarSite("https://nao-existe-1234567890abc.com.br");
console.log("dominio inexistente:", JSON.stringify(morto));

console.log("PSI mobile (pode levar ~15-25s)...");
const score = await performanceMobile("https://example.com");
console.log("performance_mobile:", score);
