import { prisma } from "@/lib/db";
import { valor as calcularValor } from "@/lib/score/score";
import { classificarWebsite } from "@/lib/diagnostico/agregador";
import { filaDeFollowUp } from "@/lib/followup";
import { ESTAGIOS_EM_ABERTO } from "@/lib/funil";
import { demoUrlFor } from "@/lib/demos";
import { ColetarForm } from "./coletar-form";
import { GerarOutreachButton } from "./gerar-outreach-button";
import { LeadRow } from "./lead-row";
import { linkWhatsapp } from "./ui";

// Ferramenta interna: a lista sempre reflete o banco, sem prerender.
export const dynamic = "force-dynamic";

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: [{ score: "desc" }, { created_at: "desc" }],
    include: {
      diagnosticos: { orderBy: { executado_em: "desc" }, take: 1 },
      // Todos os Outreach (mais recente primeiro) pra exibir no modal do Lead.
      outreaches: { orderBy: { gerado_em: "desc" } },
    },
  });

  // filaDeFollowUp espera só os enviados (mais recente primeiro); a query traz
  // todos os Outreach, então reduzimos aqui antes de calcular.
  const followUp = filaDeFollowUp(
    leads.map((l) => ({
      ...l,
      outreaches: l.outreaches
        .filter((o) => o.enviado)
        .sort(
          (a, b) =>
            (b.enviado_em?.getTime() ?? 0) - (a.enviado_em?.getTime() ?? 0),
        )
        .slice(0, 1),
    })),
  );

  // Valor (F003) on-the-fly; empates por "sem site próprio" e depois Valor.
  const linhas = leads
    .map((lead) => {
      const classif = lead.website ? classificarWebsite(lead.website) : null;
      return {
        lead,
        classif,
        semSiteProprio: !lead.website || (classif?.ehAgregador ?? false),
        valor: calcularValor({
          categoria: lead.categoria,
          num_avaliacoes: lead.num_avaliacoes,
        }),
      };
    })
    .sort((a, b) => {
      if (b.lead.score !== a.lead.score) return b.lead.score - a.lead.score;
      const sa = a.semSiteProprio ? 1 : 0;
      const sb = b.semSiteProprio ? 1 : 0;
      if (sa !== sb) return sb - sa;
      return b.valor.valor - a.valor.valor;
    });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
      <p className="mt-1 text-sm text-muted">
        Coleta (F001), Diagnóstico (F002), priorização por score (F003),
        Outreach de WhatsApp (F005) e follow-up (F006). Clique no nome para ver
        detalhes, mensagem e ações.
      </p>

      <div className="mt-6">
        <ColetarForm />
      </div>

      {followUp.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-300">
            Follow-up pendente ({followUp.length})
          </p>
          <ul className="mt-2 space-y-2">
            {followUp.map(({ lead, dias }) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <span className="font-medium">{lead.nome}</span>
                <span className="text-amber-200/60">{dias}d sem resposta</span>
                <GerarOutreachButton leadId={lead.id} tipo="followup" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm text-muted">{leads.length} Lead(s)</p>
        {leads.length > 0 && (
          <p className="mt-0.5 text-xs text-zinc-500">
            Ordenado por Score; empates com &quot;sem site próprio&quot;
            primeiro. Clique no nome (ou em Detalhes) para abrir.
          </p>
        )}
        {leads.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-zinc-400 uppercase">
                  <th className="px-3 py-3 font-medium">Nome</th>
                  <th className="px-3 py-3 font-medium">Categoria</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Score</th>
                  <th className="px-3 py-3 font-medium">Avaliações</th>
                  <th className="px-3 py-3 font-medium">Site</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ lead, valor, classif }) => {
                  const diag = lead.diagnosticos[0];
                  const ultimoOutreach = lead.outreaches[0];
                  const waLink = ultimoOutreach
                    ? linkWhatsapp(lead.telefone, ultimoOutreach.conteudo)
                    : null;
                  return (
                    <LeadRow
                      key={lead.id}
                      id={lead.id}
                      nome={lead.nome}
                      categoria={lead.categoria}
                      endereco={lead.endereco}
                      telefone={lead.telefone}
                      website={lead.website}
                      nota={lead.nota}
                      numAvaliacoes={lead.num_avaliacoes}
                      status={lead.status}
                      score={lead.score}
                      valor={valor.valor}
                      tier={valor.tier}
                      ehAgregador={classif?.ehAgregador ?? false}
                      agregadorTipo={
                        classif?.ehAgregador ? classif.tipo : null
                      }
                      diag={
                        diag
                          ? {
                              temSite: diag.tem_site,
                              siteEhAgregador: diag.site_e_agregador,
                              temHttps: diag.tem_https,
                              performanceMobile: diag.performance_mobile,
                            }
                          : null
                      }
                      diagnosticadoEm={
                        diag ? fmtData.format(diag.executado_em) : null
                      }
                      outreachConteudo={ultimoOutreach?.conteudo ?? null}
                      outreachEnviado={ultimoOutreach?.enviado ?? false}
                      outreachCount={lead.outreaches.length}
                      waLink={waLink}
                      emAberto={ESTAGIOS_EM_ABERTO.includes(lead.status)}
                      demoUrl={demoUrlFor(lead.place_id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
