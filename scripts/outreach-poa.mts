// One-off: grava o Outreach de 1º toque (Funil B · site R$2k) pros 5 leads de POA.
// Espelha o efeito de src/actions/leads/gerarOutreach.ts (cria Outreach
// canal=whatsapp, enviado=false, + link wa.me), MAS com a copy de site R$2k
// aprovada na conversa — não o pitch de automação do systemPrompt atual.
// O funil não regride: Outreach não muda status; 'contatado' só no envio (F006).
// Rodar: node --env-file=.env --experimental-transform-types scripts/outreach-poa.mts

import { prisma } from "../src/lib/db.ts";

// Abertura ⭐ aprovada por lead (casada por substring distintiva do nome).
const ABERTURAS: { match: string; mensagem: string }[] = [
  {
    match: "Ono Clínica Estética",
    mensagem:
      "Oi! Vi a Ono Clínica Estética no Google e fui dar uma olhada no site, mas tá fora do ar. Quem procura e não acha acaba indo na concorrente. Faço site simples e rápido — quer que eu monte um exemplo pra vocês verem?",
  },
  {
    match: "El Cartel",
    mensagem:
      "Oi, tudo bem? A El Cartel tem 1.167 avaliações 5⭐ — isso é uma marca de verdade. Só que toda essa reputação mora no Instagram, que não é de vocês: muda regra, cai alcance, e tá nas mãos do algoritmo. Um site é o endereço próprio da marca. Quer ver um exemplo?",
  },
  {
    match: "Bruno Mattos",
    mensagem:
      "Oi, tudo bem? Tua reputação no Google é ótima (4.9⭐, 453 avaliações), mas a presença online tá só no Facebook. Um site é a casa da marca Bruno Mattos: domínio próprio, identidade, e quem pesquisa te acha direto. Quer ver um exemplo de como ficaria?",
  },
  {
    match: "Kerols & Co",
    mensagem:
      "Oi! Vi o Kerols & Co no Google, nota 5 com mais de 300 avaliações — excelente. Reparei que salões concorrentes da região aparecem com site e vocês ainda usam o Linktree. Pra cliente nova decidindo, site passa mais autoridade que uma página de links. Posso te mostrar como ficaria o de vocês?",
  },
  {
    match: "Dra Ellen Santa Cruz",
    mensagem:
      "Oi! Vi o trabalho da Dra Ellen no Google, nota 5. Reparei que quando alguém pesquisa estética avançada em Moinhos de Vento, as clínicas concorrentes aparecem com site e a sua ainda não. Em estética, site é o que passa autoridade e fecha a paciente que tá comparando. Posso te mostrar como ficaria o seu?",
  },
];

// Mesma lógica de linkWhatsapp() da Server Action.
function linkWhatsapp(telefone: string | null, mensagem: string): string | null {
  if (!telefone) return null;
  let d = telefone.replace(/\D/g, "");
  if (!d) return null;
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(mensagem)}`;
}

async function main() {
  const leads = await prisma.lead.findMany();
  const saida = [];

  for (const ab of ABERTURAS) {
    const lead = leads.find((l) => l.nome.includes(ab.match));
    if (!lead) {
      process.stderr.write(`⚠️  lead não encontrado no banco: "${ab.match}"\n`);
      continue;
    }

    // Idempotência: se já existe um Outreach com este conteúdo, não duplica.
    const jaExiste = await prisma.outreach.findFirst({
      where: { lead_id: lead.id, conteudo: ab.mensagem },
    });
    const outreach =
      jaExiste ??
      (await prisma.outreach.create({
        data: { lead_id: lead.id, canal: "whatsapp", conteudo: ab.mensagem, enviado: false },
      }));

    saida.push({
      lead: lead.nome,
      telefone: lead.telefone,
      outreachId: outreach.id,
      novo: !jaExiste,
      waLink: linkWhatsapp(lead.telefone, ab.mensagem),
    });
  }

  console.log(JSON.stringify(saida, null, 2));
  const total = await prisma.outreach.count();
  console.log(`\nTotal de Outreach no banco: ${total}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERRO:", e?.message ?? e);
  await prisma.$disconnect();
  process.exit(1);
});
