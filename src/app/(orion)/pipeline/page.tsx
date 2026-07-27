// F021 — board do pipeline.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/db/scoped";
import {
  ESTAGIOS_BOARD,
  LABEL_ESTAGIO,
  calcularMetricas,
  formatarReais,
  percentualTarefasEstagio,
} from "@/lib/pipeline";
import { AdicionarClienteForm } from "./adicionar-cliente-form";
import { MoverEstagioSelect } from "./mover-estagio-select";

export const dynamic = "force-dynamic";

function waMe(whatsapp: string | null): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>;
}) {
  const { userId } = await requireTenant();
  const sp = await searchParams;
  const verPerdidos = sp.ver === "perdidos";

  const rows = await prisma.oportunidade.findMany({
    where: { user_id: userId },
    include: {
      tarefas: { select: { estagio: true, concluida: true } },
    },
    orderBy: { updated_at: "desc" },
  });

  const metricas = calcularMetricas(rows);
  const ativas = rows.filter((r) => r.status !== "lost");
  const perdidas = rows.filter((r) => r.status === "lost");

  return (
    <main className="px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">
            Do primeiro contato até a entrega — com o passo a passo embutido.
          </p>
        </div>
        <AdicionarClienteForm />
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs text-zinc-500 uppercase">Em aberto</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {ativas.filter((a) => a.status === "open").length}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-zinc-500 uppercase">Ganhos</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">
            {metricas.ganhos}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-zinc-500 uppercase">Faturamento fechado</p>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {formatarReais(metricas.faturamentoFechado)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-zinc-500 uppercase">Perdidos</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-400">
            {metricas.perdidos}
          </p>
          <Link
            href={verPerdidos ? "/pipeline" : "/pipeline?ver=perdidos"}
            className="mt-1 inline-block text-xs text-zinc-500 hover:text-zinc-300"
          >
            {verPerdidos ? "Voltar ao board" : "Ver arquivo"}
          </Link>
        </div>
      </section>

      {verPerdidos ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400">Perdidos</h2>
          {perdidas.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma oportunidade perdida.</p>
          ) : (
            <ul className="space-y-2">
              {perdidas.map((o) => (
                <li key={o.id} className="card opacity-70">
                  <Link
                    href={`/pipeline/${o.id}`}
                    className="font-medium text-zinc-200 hover:text-primary"
                  >
                    {o.nome_negocio}
                  </Link>
                  {o.motivo_perda && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Motivo: {o.motivo_perda}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="mt-8 flex gap-3 overflow-x-auto pb-4">
          {ESTAGIOS_BOARD.map((estagio) => {
            const cards = ativas.filter((o) => o.estagio === estagio);
            return (
              <div
                key={estagio}
                className="flex w-64 shrink-0 flex-col rounded-xl border border-border bg-card/40"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <p className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">
                    {LABEL_ESTAGIO[estagio]}
                  </p>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                    {cards.length}
                  </span>
                </div>
                <ul className="flex flex-1 flex-col gap-2 p-2">
                  {cards.length === 0 && (
                    <li className="px-2 py-6 text-center text-xs text-zinc-600">
                      Vazio
                    </li>
                  )}
                  {cards.map((o) => {
                    const pct = percentualTarefasEstagio(o.tarefas, o.estagio);
                    const wa = waMe(o.whatsapp);
                    const valorNum =
                      o.valor == null ? null : Number(o.valor.toString());
                    return (
                      <li
                        key={o.id}
                        className="rounded-lg border border-border/80 bg-zinc-900/60 p-2.5"
                      >
                        <Link
                          href={`/pipeline/${o.id}`}
                          className="block text-sm font-medium text-zinc-100 hover:text-primary"
                        >
                          {o.nome_negocio}
                        </Link>
                        {o.cidade && (
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            {o.cidade}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                          {valorNum != null && (
                            <span>{formatarReais(valorNum)}</span>
                          )}
                          <span>{pct}% checklist</span>
                          {o.status === "won" && (
                            <span className="text-emerald-400">Ganho</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <MoverEstagioSelect
                            oportunidadeId={o.id}
                            estagioAtual={o.estagio}
                            compact
                          />
                          {wa && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
