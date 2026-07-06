// One-off: prospecção Funil B (site R$2k) — Porto Alegre.
// Coleta (Places) → diagnóstico de presença → score, tudo in-memory (sem banco).
// Rodar: node --env-file=.env --experimental-strip-types scripts/prospect-poa.mts
//
// Não persiste no Postgres de propósito: serve pra escolher os melhores leads
// pra começar. A persistência (pro outreach F005) entra depois, com o banco up.

import { textSearch, type PlacesResult } from "../src/lib/places/textSearch.ts";
import { classificarWebsite } from "../src/lib/diagnostico/agregador.ts";
import { verificarSite } from "../src/lib/diagnostico/verificarSite.ts";

// Inline de src/lib/score/{score,nichos}.ts — Node ESM não resolve o import
// extensionless "./nichos" da lib. Mesma fórmula/pesos da F003.
type Tier = "ALTO" | "MEDIO" | "BAIXO";
const ALTO = new Set(["dentist","dental_clinic","skin_care_clinic","dermatologist","doctor","medical_clinic","physiotherapist","psychologist","nutritionist","veterinary_care","lawyer","accounting","architect","real_estate_agency"]);
const MEDIO = new Set(["restaurant","cafe","gym","fitness_center","hair_salon","barber_shop","spa","pet_store","optician","school","car_repair"]);
function tierDoNicho(categoria: string): Tier {
  const c = categoria.toLowerCase();
  if (ALTO.has(c)) return "ALTO";
  if (MEDIO.has(c)) return "MEDIO";
  return "BAIXO";
}
const TIER_SCORE: Record<Tier, number> = { ALTO: 100, MEDIO: 55, BAIXO: 20 };
function porteScore(n: number | null): number {
  if (n === null || n <= 20) return 20;
  if (n <= 80) return 50;
  if (n <= 300) return 80;
  return 100;
}
function calcularValor(input: { categoria: string; num_avaliacoes: number | null }) {
  const tier = tierDoNicho(input.categoria);
  const valor = Math.round(0.6 * TIER_SCORE[tier] + 0.4 * porteScore(input.num_avaliacoes));
  return { valor, tier };
}
function calcularNecessidade(d: { tem_site: boolean; site_e_agregador: boolean; tem_https: boolean | null; performance_mobile: number | null }): number {
  if (!d.tem_site || d.site_e_agregador) return 100;
  let n = 20;
  if (d.performance_mobile === null) n += 25;
  else if (d.performance_mobile < 50) n += 50;
  else if (d.performance_mobile < 80) n += 25;
  if (d.tem_https === false) n += 20;
  return Math.min(n, 100);
}
function calcularScore(input: { valor: number; necessidade: number }): number {
  return Math.round(0.55 * input.valor + 0.45 * input.necessidade);
}

const QUERIES = [
  "clínica de estética em Porto Alegre RS",
  "barbearia em Porto Alegre RS",
  "salão de beleza em Porto Alegre RS",
];

type Diag = {
  tem_site: boolean;
  site_e_agregador: boolean;
  tem_https: boolean | null;
  performance_mobile: number | null;
  resumo: string;
  agregadorPlataforma?: string;
};

// Replica src/actions/leads/diagnosticar.ts, mas SEM PageSpeed (chave bloqueada
// → performance sempre null; não afeta SEM_SITE, que é o alvo do Funil B).
async function diagnosticar(lead: PlacesResult): Promise<Diag> {
  if (!lead.website) {
    return {
      tem_site: false,
      site_e_agregador: false,
      tem_https: null,
      performance_mobile: null,
      resumo: "SEM SITE",
    };
  }

  const classif = classificarWebsite(lead.website);
  if (classif.ehAgregador) {
    return {
      tem_site: true,
      site_e_agregador: true,
      tem_https: classif.temHttps,
      performance_mobile: null,
      resumo: `só ${classif.tipo === "social" ? "rede social" : "agregador"} (${classif.plataforma})`,
      agregadorPlataforma: classif.plataforma,
    };
  }

  const site = await verificarSite(lead.website);
  if (!site.temSite) {
    return {
      tem_site: false,
      site_e_agregador: false,
      tem_https: null,
      performance_mobile: null,
      resumo: "site FORA DO AR",
    };
  }
  return {
    tem_site: true,
    site_e_agregador: false,
    tem_https: site.temHttps,
    performance_mobile: null,
    resumo: `site ok${site.temHttps ? " · https" : " · SEM https"} (perf indisponível)`,
  };
}

async function main() {
  // 1. Coleta + dedup por place_id
  const porId = new Map<string, PlacesResult>();
  for (const q of QUERIES) {
    process.stderr.write(`Buscando: ${q} ... `);
    const res = await textSearch(q);
    let novos = 0;
    for (const p of res) {
      if (!porId.has(p.id)) {
        porId.set(p.id, p);
        novos++;
      }
    }
    process.stderr.write(`${res.length} resultados (${novos} novos)\n`);
  }
  const leads = [...porId.values()];
  process.stderr.write(`\nTotal único: ${leads.length} leads. Diagnosticando...\n`);

  // 2. Diagnóstico + 3. Score
  const enriquecidos = [];
  for (const lead of leads) {
    const diag = await diagnosticar(lead);
    const { valor: v, tier } = calcularValor({
      categoria: lead.categoria,
      num_avaliacoes: lead.num_avaliacoes,
    });
    const n = calcularNecessidade({
      tem_site: diag.tem_site,
      site_e_agregador: diag.site_e_agregador,
      tem_https: diag.tem_https,
      performance_mobile: diag.performance_mobile,
    });
    const score = calcularScore({ valor: v, necessidade: n });
    enriquecidos.push({ lead, diag, v, tier, n, score });
  }

  // Funil B vende SITE: alvo = quem NÃO tem site próprio (sem site / fora do ar
  // / só agregador). Quem já tem site fica de fora dessa primeira leva.
  const alvos = enriquecidos
    .filter((e) => !e.diag.tem_site || e.diag.site_e_agregador)
    .sort((a, b) => b.score - a.score);

  const comSite = enriquecidos.filter((e) => e.diag.tem_site && !e.diag.site_e_agregador).length;

  process.stderr.write(
    `\n${alvos.length} alvos sem site próprio · ${comSite} já têm site (fora da leva)\n`,
  );

  // 4. Saída — JSON do top 8 (entrego top 5, mostro reservas)
  const out = alvos.slice(0, 8).map((e, i) => ({
    rank: i + 1,
    nome: e.lead.nome,
    categoria: e.lead.categoria,
    tier: e.tier,
    telefone: e.lead.telefone ?? "(sem telefone)",
    endereco: e.lead.endereco,
    avaliacoes: e.lead.num_avaliacoes ?? 0,
    nota: e.lead.nota ?? null,
    situacao: e.diag.resumo,
    score: e.score,
    valor: e.v,
    necessidade: e.n,
  }));

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error("ERRO:", e?.message ?? e);
  process.exit(1);
});
