import Link from "next/link";
import { prisma } from "@/lib/db";
import { filaDeFollowUp } from "@/lib/followup";
import { ESTAGIOS_EM_ABERTO, taxasDeConversao } from "@/lib/funil";
import type { LeadStatus } from "@prisma/client";

// Dashboard sempre reflete o banco, sem prerender.
export const dynamic = "force-dynamic";

const ESTAGIOS: { status: LeadStatus; label: string; cor: string }[] = [
  { status: "novo", label: "Novo", cor: "bg-zinc-500" },
  { status: "enriquecido", label: "Enriquecido", cor: "bg-sky-500" },
  { status: "priorizado", label: "Priorizado", cor: "bg-violet-500" },
  { status: "contatado", label: "Contatado", cor: "bg-amber-500" },
  { status: "respondeu", label: "Respondeu", cor: "bg-cyan-500" },
  { status: "qualificado", label: "Qualificado", cor: "bg-teal-500" },
  { status: "proposta", label: "Proposta", cor: "bg-indigo-500" },
  { status: "ganho", label: "Ganho", cor: "bg-emerald-500" },
  { status: "perdido", label: "Perdido", cor: "bg-red-500" },
];

const LABEL: Record<LeadStatus, string> = Object.fromEntries(
  ESTAGIOS.map((e) => [e.status, e.label]),
) as Record<LeadStatus, string>;

export default async function DashboardPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { score: "desc" },
    include: {
      outreaches: {
        where: { enviado: true },
        orderBy: { enviado_em: "desc" },
        take: 1,
      },
    },
  });

  const porStatus = Object.fromEntries(
    ESTAGIOS.map((e) => [
      e.status,
      leads.filter((l) => l.status === e.status).length,
    ]),
  ) as Record<LeadStatus, number>;
  const maxEstagio = Math.max(1, ...Object.values(porStatus));

  // Funil (silhueta): estágios de progressão, sem `perdido` (vazamento lateral).
  // Largura de cada faixa ∝ contagem; faixa com 0 vira um fio fino centralizado.
  const funilStages = ESTAGIOS.filter((e) => e.status !== "perdido");
  const larguras = funilStages.map((e) =>
    porStatus[e.status] > 0
      ? Math.max(10, (porStatus[e.status] / maxEstagio) * 100)
      : 3,
  );

  const scoreMedio =
    leads.length > 0
      ? Math.round(leads.reduce((soma, l) => soma + l.score, 0) / leads.length)
      : 0;

  // Em aberto: no funil de venda e ainda sem desfecho final.
  const emAberto = ESTAGIOS_EM_ABERTO.reduce(
    (soma, st) => soma + porStatus[st],
    0,
  );

  const taxas = taxasDeConversao(porStatus);

  // Prontos pra contato: score alto e ainda não contatados.
  const exigemAtencao = leads
    .filter(
      (l) =>
        l.score >= 60 &&
        (l.status === "novo" ||
          l.status === "enriquecido" ||
          l.status === "priorizado"),
    )
    .slice(0, 5);

  const followUp = filaDeFollowUp(leads);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Funil de prospecção · visão geral
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
            Funil por estágio
          </h2>
          {leads.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nenhum Lead ainda.{" "}
              <Link
                href="/leads"
                className="text-primary hover:text-primary-hover hover:underline"
              >
                Coletar os primeiros →
              </Link>
            </p>
          ) : (
            <>
              <div className="mt-5 flex gap-3">
                <div className="w-24 shrink-0">
                  {funilStages.map((e) => (
                    <div
                      key={e.status}
                      className="flex h-[42px] items-center justify-end pr-1 text-right text-xs leading-tight text-zinc-400"
                    >
                      {e.label}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  {funilStages.map((e, i) => {
                    const topW = larguras[i] ?? 3;
                    const botW = larguras[i + 1] ?? topW;
                    return (
                      <div
                        key={e.status}
                        className={`relative ${e.cor}`}
                        style={{
                          height: 42,
                          clipPath: `polygon(${50 - topW / 2}% 0, ${50 + topW / 2}% 0, ${50 + botW / 2}% 100%, ${50 - botW / 2}% 100%)`,
                        }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold text-white/95">
                          {porStatus[e.status]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-3 text-xs">
                <span className="w-24 shrink-0 text-right text-zinc-400">
                  Perdido
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-800/40">
                  <div
                    className="h-full rounded bg-red-500"
                    style={{
                      width: `${Math.max(
                        porStatus.perdido > 0 ? 4 : 0,
                        (porStatus.perdido / maxEstagio) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-zinc-300">
                  {porStatus.perdido}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                Perdido = vazamento lateral (sai de qualquer estágio pós-contato)
              </p>
            </>
          )}
        </section>

        <div className="grid gap-4">
          <section className="card">
            <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
              Total de Leads
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold">
              {leads.length}
            </p>
          </section>
          <section className="card">
            <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
              Score médio
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold">
              {scoreMedio}
            </p>
            <p className="mt-1 text-xs text-zinc-500">de 0 a 100</p>
          </section>
          <section className="card">
            <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
              Ganhos
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold text-primary">
              {porStatus.ganho}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {porStatus.perdido} perdido(s)
            </p>
          </section>
          <section className="card">
            <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
              Em aberto
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold text-amber-300">
              {emAberto}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              contatado → proposta, sem desfecho
            </p>
          </section>
        </div>
      </div>

      <section className="card mt-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
          Taxas de conversão
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Funil de venda · aproximação sobre o estado atual (sem histórico)
        </p>
        <div className="mt-4 flex flex-wrap items-stretch gap-2">
          {taxas.map((passo) => (
            <div
              key={`${passo.de}-${passo.para}`}
              className="min-w-[8rem] flex-1 rounded-lg border border-border bg-zinc-800/30 px-3 py-2.5"
            >
              <p className="truncate text-xs text-zinc-400">
                {LABEL[passo.de]} → {LABEL[passo.para]}
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-zinc-100">
                {passo.taxa === null
                  ? "—"
                  : `${Math.round(passo.taxa * 100)}%`}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
            Exigem atenção
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Score ≥ 60 e ainda sem Outreach enviado
          </p>
          {exigemAtencao.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nada pendente por aqui.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border/60">
              {exigemAtencao.map((lead) => (
                <li
                  key={lead.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lead.nome}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {lead.categoria}
                    </p>
                  </div>
                  <span className="badge shrink-0 bg-emerald-500/15 font-mono text-emerald-300">
                    {lead.score}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/leads"
            className="mt-3 inline-block text-sm text-primary transition-colors hover:text-primary-hover hover:underline"
          >
            Abrir Leads →
          </Link>
        </section>

        <section className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-5">
          <h2 className="text-sm font-semibold tracking-wide text-red-300 uppercase">
            Follow-up pendente
          </h2>
          <p className="mt-1 text-xs text-red-300/60">
            Contatados sem resposta há 3+ dias
          </p>
          {followUp.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Ninguém esperando.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {followUp.map(({ lead, dias }) => (
                <li
                  key={lead.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate font-medium">{lead.nome}</span>
                  <span className="badge shrink-0 bg-red-500/15 font-mono text-red-300">
                    {dias}d
                  </span>
                </li>
              ))}
            </ul>
          )}
          {followUp.length > 0 && (
            <Link
              href="/leads"
              className="mt-3 inline-block text-sm text-red-300 transition-colors hover:text-red-200 hover:underline"
            >
              Resolver →
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}
