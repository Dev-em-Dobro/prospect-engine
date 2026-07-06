// One-off: persiste os 5 leads escolhidos (Funil B · Porto Alegre) passando pela
// esteira completa — Lead → Diagnóstico → score → status=priorizado — espelhando
// src/actions/leads/{coletar,diagnosticar,priorizar}.ts. Idempotente: re-rodar não
// duplica (place_id é unique) e re-diagnostica/re-prioriza sem regredir o funil.
// Rodar: node --env-file=.env --experimental-transform-types scripts/persistir-poa.mts

import { textSearch, type PlacesResult } from "../src/lib/places/textSearch.ts";
import { classificarWebsite } from "../src/lib/diagnostico/agregador.ts";
import { verificarSite } from "../src/lib/diagnostico/verificarSite.ts";
import { prisma } from "../src/lib/db.ts";

const QUERIES = [
  "clínica de estética em Porto Alegre RS",
  "barbearia em Porto Alegre RS",
  "salão de beleza em Porto Alegre RS",
];

// Os 5 escolhidos — casados por substring distintiva do nome do Place.
const ALVOS = [
  "Ono Clínica Estética",
  "El Cartel",
  "Bruno Mattos",
  "Kerols & Co",
  "Dra Ellen Santa Cruz",
];

// Inline do score (Node ESM não resolve o import extensionless da lib). Mesma F003.
type Tier = "ALTO" | "MEDIO" | "BAIXO";
const ALTO = new Set(["dentist","dental_clinic","skin_care_clinic","dermatologist","doctor","medical_clinic","physiotherapist","psychologist","nutritionist","veterinary_care","lawyer","accounting","architect","real_estate_agency"]);
const MEDIO = new Set(["restaurant","cafe","gym","fitness_center","hair_salon","barber_shop","spa","pet_store","optician","school","car_repair"]);
const TIER_SCORE: Record<Tier, number> = { ALTO: 100, MEDIO: 55, BAIXO: 20 };
function tier(c: string): Tier { const x = c.toLowerCase(); return ALTO.has(x) ? "ALTO" : MEDIO.has(x) ? "MEDIO" : "BAIXO"; }
function porte(n: number | null): number { if (n === null || n <= 20) return 20; if (n <= 80) return 50; if (n <= 300) return 80; return 100; }
function valor(categoria: string, nav: number | null) { return Math.round(0.6 * TIER_SCORE[tier(categoria)] + 0.4 * porte(nav)); }
function necessidade(d: { tem_site: boolean; site_e_agregador: boolean; tem_https: boolean | null; performance_mobile: number | null }): number {
  if (!d.tem_site || d.site_e_agregador) return 100;
  let n = 20;
  if (d.performance_mobile === null) n += 25; else if (d.performance_mobile < 50) n += 50; else if (d.performance_mobile < 80) n += 25;
  if (d.tem_https === false) n += 20;
  return Math.min(n, 100);
}
function score(categoria: string, nav: number | null, d: Parameters<typeof necessidade>[0]) {
  return Math.round(0.55 * valor(categoria, nav) + 0.45 * necessidade(d));
}

type Diag = { tem_site: boolean; site_e_agregador: boolean; tem_https: boolean | null; tempo_carregamento_ms: number | null; performance_mobile: number | null };

// Espelha diagnosticar.ts, sem PageSpeed (chave bloqueada → perf null).
async function diagnosticar(lead: PlacesResult): Promise<Diag> {
  if (!lead.website) return { tem_site: false, site_e_agregador: false, tem_https: null, tempo_carregamento_ms: null, performance_mobile: null };
  const c = classificarWebsite(lead.website);
  if (c.ehAgregador) return { tem_site: true, site_e_agregador: true, tem_https: c.temHttps, tempo_carregamento_ms: null, performance_mobile: null };
  const s = await verificarSite(lead.website);
  if (!s.temSite) return { tem_site: false, site_e_agregador: false, tem_https: null, tempo_carregamento_ms: null, performance_mobile: null };
  return { tem_site: true, site_e_agregador: false, tem_https: s.temHttps, tempo_carregamento_ms: s.tempoMs, performance_mobile: null };
}

async function main() {
  // 1. Coleta + dedup
  const porId = new Map<string, PlacesResult>();
  for (const q of QUERIES) {
    for (const p of await textSearch(q)) if (!porId.has(p.id)) porId.set(p.id, p);
  }

  // 2. Filtra os 5 alvos
  const escolhidos = [...porId.values()].filter((p) => ALVOS.some((a) => p.nome.includes(a)));
  process.stderr.write(`Casados ${escolhidos.length}/${ALVOS.length} alvos no Places.\n`);
  if (escolhidos.length < ALVOS.length) {
    const achados = escolhidos.map((e) => e.nome);
    for (const a of ALVOS) if (!achados.some((n) => n.includes(a))) process.stderr.write(`  ⚠️  não casou: "${a}"\n`);
  }

  const persistidos = [];
  for (const lead of escolhidos) {
    // 3. Lead (coleta) — idempotente por place_id
    await prisma.lead.upsert({
      where: { place_id: lead.id },
      update: {}, // não sobrescreve dados existentes
      create: {
        nome: lead.nome, endereco: lead.endereco, telefone: lead.telefone, website: lead.website,
        categoria: lead.categoria, nota: lead.nota, num_avaliacoes: lead.num_avaliacoes, place_id: lead.id,
      },
    });
    const row = await prisma.lead.findUniqueOrThrow({ where: { place_id: lead.id } });

    // 4. Diagnóstico + transição novo→enriquecido
    const d = await diagnosticar(lead);
    await prisma.$transaction([
      prisma.diagnostico.create({ data: { lead_id: row.id, ...d } }),
      ...(row.status === "novo" ? [prisma.lead.update({ where: { id: row.id }, data: { status: "enriquecido" } })] : []),
    ]);

    // 5. Score + transição enriquecido→priorizado
    const sc = score(lead.categoria, lead.num_avaliacoes, d);
    const atual = await prisma.lead.findUniqueOrThrow({ where: { id: row.id } });
    await prisma.lead.update({
      where: { id: row.id },
      data: atual.status === "enriquecido" ? { score: sc, status: "priorizado" } : { score: sc },
    });

    persistidos.push({ nome: lead.nome, score: sc, situacao: !d.tem_site ? "sem site/fora do ar" : d.site_e_agregador ? "só agregador/social" : "site ok" });
  }

  console.log(JSON.stringify(persistidos, null, 2));
  const total = await prisma.lead.count();
  console.log(`\nTotal de leads no banco agora: ${total}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("ERRO:", e?.message ?? e); await prisma.$disconnect(); process.exit(1); });
