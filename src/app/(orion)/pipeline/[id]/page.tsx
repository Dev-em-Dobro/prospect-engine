// F021 — detalhe da Oportunidade.

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/db/scoped";
import {
  ESTAGIOS_BOARD,
  LABEL_ESTAGIO,
  percentualTarefasEstagio,
} from "@/lib/pipeline";
import type { EstagioOportunidade } from "@prisma/client";
import { MoverEstagioSelect } from "../mover-estagio-select";
import { TarefaCheckbox } from "../tarefa-checkbox";
import { NotaForm } from "../nota-form";
import { GanhoPerdidoForms, ValorForm } from "../status-forms";

export const dynamic = "force-dynamic";

function waMe(whatsapp: string | null): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

export default async function OportunidadeDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await requireTenant();

  const opp = await prisma.oportunidade.findFirst({
    where: { id, user_id: userId },
    include: {
      tarefas: { orderBy: { ordem: "asc" } },
      notas: { orderBy: { created_at: "desc" } },
    },
  });

  if (!opp) notFound();

  const valorNum = opp.valor == null ? null : Number(opp.valor.toString());
  const pct = percentualTarefasEstagio(opp.tarefas, opp.estagio);
  const wa = waMe(opp.whatsapp);

  const estagiosComTarefas: EstagioOportunidade[] = [
    ...ESTAGIOS_BOARD,
    "recorrencia",
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/pipeline"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Pipeline
      </Link>

      <header className="mt-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              {opp.nome_negocio}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {[opp.cidade, opp.nicho, opp.origem].filter(Boolean).join(" · ")}
            </p>
            {opp.status !== "open" && (
              <p className="mt-1 text-xs font-medium uppercase tracking-wide">
                {opp.status === "won" ? (
                  <span className="text-emerald-400">Ganho</span>
                ) : (
                  <span className="text-red-400">
                    Perdido{opp.motivo_perda ? `: ${opp.motivo_perda}` : ""}
                  </span>
                )}
              </p>
            )}
          </div>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              WhatsApp
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-48">
            <p className="mb-1 text-xs text-zinc-500">Estágio</p>
            <MoverEstagioSelect
              oportunidadeId={opp.id}
              estagioAtual={opp.estagio}
            />
          </div>
          <ValorForm oportunidadeId={opp.id} valorAtual={valorNum} />
          <p className="text-xs text-zinc-500">
            Checklist do estágio: <strong className="text-zinc-300">{pct}%</strong>
          </p>
        </div>
      </header>

      <section className="mt-8 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300">Playbook</h2>
        {estagiosComTarefas.map((estagio) => {
          const tarefas = opp.tarefas.filter((t) => t.estagio === estagio);
          if (tarefas.length === 0) return null;
          const atual = estagio === opp.estagio;
          return (
            <details
              key={estagio}
              open={atual}
              className="card border-border/80"
            >
              <summary className="cursor-pointer text-sm font-medium text-zinc-200">
                {LABEL_ESTAGIO[estagio]}
                {atual && (
                  <span className="ml-2 text-xs font-normal text-primary">
                    atual
                  </span>
                )}
              </summary>
              <ul className="mt-3 border-t border-border pt-2">
                {tarefas.map((t) => (
                  <TarefaCheckbox
                    key={t.id}
                    tarefaId={t.id}
                    concluida={t.concluida}
                    titulo={t.titulo}
                    entregavelSlug={t.entregavel_slug}
                  />
                ))}
              </ul>
            </details>
          );
        })}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Notas</h2>
        <NotaForm oportunidadeId={opp.id} />
        {opp.notas.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma nota ainda.</p>
        ) : (
          <ul className="space-y-2">
            {opp.notas.map((n) => (
              <li key={n.id} className="rounded-lg border border-border/60 bg-zinc-900/40 px-3 py-2">
                <p className="text-sm whitespace-pre-wrap text-zinc-200">
                  {n.corpo}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {n.created_at.toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {opp.status === "open" && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">
            Encerrar
          </h2>
          <GanhoPerdidoForms
            oportunidadeId={opp.id}
            valorAtual={valorNum}
          />
        </section>
      )}
    </main>
  );
}
