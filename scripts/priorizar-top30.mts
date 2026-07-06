// One-off: prioriza os TOP 30 alvos do Funil B (sem site próprio) em Porto Alegre.
// Coleta (Places, vários nichos) → diagnóstico → score → grava os 30 melhores
// com status=priorizado (esteira completa, idempotente por place_id).
// Espelha coletar/diagnosticar/priorizar. Não dispara mensagem.
// Rodar: node --env-file=.env --experimental-transform-types scripts/priorizar-top30.mts

import { textSearch, type PlacesResult } from "../src/lib/places/textSearch.ts";
import { classificarWebsite } from "../src/lib/diagnostico/agregador.ts";
import { verificarSite } from "../src/lib/diagnostico/verificarSite.ts";
import { prisma } from "../src/lib/db.ts";

const CIDADE = "Porto Alegre RS";
const NICHOS = [
  "clínica de estética",
  "barbearia",
  "salão de beleza",
  "studio de sobrancelha",
  "manicure e pedicure",
  "depilação",
  "estúdio de tatuagem",
  "academia",
  "pet shop",
  "oficina mecânica",
];
const TOP_N = 30;

// --- score inline (mesma F003) -------------------------------------------
type Tier = "ALTO" | "MEDIO" | "BAIXO";
const ALTO = new Set(["dentist","dental_clinic","skin_care_clinic","dermatologist","doctor","medical_clinic","physiotherapist","psychologist","nutritionist","veterinary_care","lawyer","accounting","architect","real_estate_agency"]);
const MEDIO = new Set(["restaurant","cafe","gym","fitness_center","hair_salon","barber_shop","spa","pet_store","optician","school","car_repair"]);
const TIER_SCORE: Record<Tier, number> = { ALTO: 100, MEDIO: 55, BAIXO: 20 };
const tier = (c: string): Tier => { const x = c.toLowerCase(); return ALTO.has(x) ? "ALTO" : MEDIO.has(x) ? "MEDIO" : "BAIXO"; };
const porte = (n: number | null) => (n === null || n <= 20 ? 20 : n <= 80 ? 50 : n <= 300 ? 80 : 100);
const valor = (cat: string, nav: number | null) => Math.round(0.6 * TIER_SCORE[tier(cat)] + 0.4 * porte(nav));
function necessidade(d: { tem_site: boolean; site_e_agregador: boolean; tem_https: boolean | null; performance_mobile: number | null }) {
  if (!d.tem_site || d.site_e_agregador) return 100;
  let n = 20;
  if (d.performance_mobile === null) n += 25; else if (d.performance_mobile < 50) n += 50; else if (d.performance_mobile < 80) n += 25;
  if (d.tem_https === false) n += 20;
  return Math.min(n, 100);
}
const score = (cat: string, nav: number | null, d: Parameters<typeof necessidade>[0]) =>
  Math.round(0.55 * valor(cat, nav) + 0.45 * necessidade(d));

type Diag = { tem_site: boolean; site_e_agregador: boolean; tem_https: boolean | null; tempo_carregamento_ms: number | null; performance_mobile: number | null };
async function diagnosticar(lead: PlacesResult): Promise<Diag> {
  if (!lead.website) return { tem_site: false, site_e_agregador: false, tem_https: null, tempo_carregamento_ms: null, performance_mobile: null };
  const c = classificarWebsite(lead.website);
  if (c.ehAgregador) return { tem_site: true, site_e_agregador: true, tem_https: c.temHttps, tempo_carregamento_ms: null, performance_mobile: null };
  const s = await verificarSite(lead.website);
  if (!s.temSite) return { tem_site: false, site_e_agregador: false, tem_https: null, tempo_carregamento_ms: null, performance_mobile: null };
  return { tem_site: true, site_e_agregador: false, tem_https: s.temHttps, tempo_carregamento_ms: s.tempoMs, performance_mobile: null };
}
const situacao = (d: Diag) => (!d.tem_site ? "sem site/fora do ar" : d.site_e_agregador ? "só agregador/social" : "site ok");

async function main() {
  // 1. Coleta + dedup
  const porId = new Map<string, PlacesResult>();
  for (const n of NICHOS) {
    const q = `${n} em ${CIDADE}`;
    try {
      const res = await textSearch(q);
      let novos = 0;
      for (const p of res) if (!porId.has(p.id)) { porId.set(p.id, p); novos++; }
      process.stderr.write(`  ${q}: ${res.length} (${novos} novos)\n`);
    } catch (e) {
      process.stderr.write(`  ${q}: ERRO ${(e as Error).message}\n`);
    }
  }
  const leads = [...porId.values()];
  process.stderr.write(`\nTotal único coletado: ${leads.length}. Diagnosticando...\n`);

  // 2. Diagnóstico (concorrente) + 3. Score
  const diags = await Promise.all(leads.map(diagnosticar));
  const enriquecidos = leads.map((lead, i) => {
    const d = diags[i]!;
    return { lead, d, sc: score(lead.categoria, lead.num_avaliacoes, d) };
  });

  // 4. Filtra alvos do Funil B (sem site próprio) e pega top N por score
  const alvos = enriquecidos
    .filter((e) => !e.d.tem_site || e.d.site_e_agregador)
    .sort((a, b) => b.sc - a.sc);
  const top = alvos.slice(0, TOP_N);
  process.stderr.write(`${alvos.length} alvos sem site próprio · gravando top ${top.length}\n\n`);

  // 5. Persiste a esteira (upsert Lead → Diagnóstico → score/priorizado), idempotente
  let criados = 0, atualizados = 0;
  const linhas = [];
  for (const { lead, d, sc } of top) {
    const existe = await prisma.lead.findUnique({ where: { place_id: lead.id } });
    await prisma.lead.upsert({
      where: { place_id: lead.id },
      update: {},
      create: {
        nome: lead.nome, endereco: lead.endereco, telefone: lead.telefone, website: lead.website,
        categoria: lead.categoria, nota: lead.nota, num_avaliacoes: lead.num_avaliacoes, place_id: lead.id,
      },
    });
    const row = await prisma.lead.findUniqueOrThrow({ where: { place_id: lead.id }, include: { diagnosticos: { take: 1 } } });
    if (row.diagnosticos.length === 0) {
      await prisma.diagnostico.create({ data: { lead_id: row.id, tem_site: d.tem_site, site_e_agregador: d.site_e_agregador, tem_https: d.tem_https, tempo_carregamento_ms: d.tempo_carregamento_ms, performance_mobile: d.performance_mobile } });
    }
    // Avança pra priorizado sem regredir quem já passou disso.
    const prePriorizado = row.status === "novo" || row.status === "enriquecido";
    await prisma.lead.update({ where: { id: row.id }, data: prePriorizado ? { score: sc, status: "priorizado" } : { score: sc } });
    existe ? atualizados++ : criados++;
    linhas.push({ score: sc, nome: lead.nome, categoria: lead.categoria, situacao: situacao(d), telefone: lead.telefone ?? "—" });
  }

  linhas.forEach((l, i) => process.stderr.write(`  ${String(i + 1).padStart(2)}. [${l.score}] ${l.nome}  ·  ${l.categoria}  ·  ${l.situacao}  ·  ${l.telefone}\n`));
  const totalBanco = await prisma.lead.count();
  const totalPriorizados = await prisma.lead.count({ where: { status: "priorizado" } });
  console.log(JSON.stringify({ coletados: leads.length, alvosSemSite: alvos.length, gravados: top.length, criados, atualizados, totalNoBanco: totalBanco, totalPriorizados }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("ERRO:", e?.message ?? e); await prisma.$disconnect(); process.exit(1); });
