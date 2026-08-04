"use client";

// F022 — histórico de Propostas: reabrir rascunho, copiar, PDF, excluir.

import { useActionState, useState } from "react";
import {
  marcarPropostaEnviada,
  type MarcarPropostaEnviadaState,
} from "@/actions/leads/marcarPropostaEnviada";
import {
  excluirPropostaAction,
  type ExcluirPropostaState,
} from "@/actions/leads/excluirProposta";
import {
  aplicarValorProposta,
  type AplicarValorPropostaState,
} from "@/actions/pipeline/aplicar-valor-proposta";
import { milhar } from "@/lib/proposta/formatar";

export type PropostaHistoricoItem = {
  id: string;
  versao: number;
  resumo: string;
  escopo: { item: string; descricao: string }[];
  entregaveis: string[];
  prazo_estimado: string;
  observacoes: string;
  faixa_min: number;
  faixa_max: number;
  texto_copiavel: string;
  enviada: boolean;
};

const initialMarcar: MarcarPropostaEnviadaState = { kind: "idle" };
const initialExcluir: ExcluirPropostaState = { kind: "idle" };
const initialValor: AplicarValorPropostaState = { kind: "idle" };

function MarcarEnviada({ propostaId }: { propostaId: string }) {
  const [state, action, pending] = useActionState(
    marcarPropostaEnviada,
    initialMarcar,
  );
  if (state.kind === "ok") {
    return <p className="mt-1 text-xs text-emerald-400">{state.mensagem}</p>;
  }
  return (
    <form action={action}>
      <input type="hidden" name="proposta_id" value={propostaId} />
      <button type="submit" disabled={pending} className="btn-ghost">
        {pending ? "Marcando..." : "Marcar como enviada"}
      </button>
      {state.kind === "erro" && (
        <p className="mt-1 text-xs text-red-400">{state.mensagem}</p>
      )}
    </form>
  );
}

function ExcluirRascunho({ propostaId }: { propostaId: string }) {
  const [state, action, pending] = useActionState(
    excluirPropostaAction,
    initialExcluir,
  );
  if (state.kind === "ok") {
    return <p className="text-xs text-emerald-400">{state.mensagem}</p>;
  }
  return (
    <form action={action} className="inline-flex items-center">
      <input type="hidden" name="proposta_id" value={propostaId} />
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer text-xs leading-none text-red-400/90 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        onClick={(e) => {
          if (!confirm("Excluir este rascunho?")) e.preventDefault();
        }}
      >
        {pending ? "Excluindo..." : "Excluir"}
      </button>
      {state.kind === "erro" && (
        <p className="mt-1 text-xs text-red-400">{state.mensagem}</p>
      )}
    </form>
  );
}

function AplicarValor({
  propostaId,
  oportunidadeId,
}: {
  propostaId: string;
  oportunidadeId: string;
}) {
  const [state, action, pending] = useActionState(
    aplicarValorProposta,
    initialValor,
  );
  if (state.kind === "ok") {
    return <p className="mt-1 text-xs text-emerald-400">{state.mensagem}</p>;
  }
  return (
    <form action={action}>
      <input type="hidden" name="proposta_id" value={propostaId} />
      <input type="hidden" name="oportunidade_id" value={oportunidadeId} />
      <button type="submit" disabled={pending} className="btn-ghost">
        {pending ? "Aplicando..." : "Aplicar valor sugerido"}
      </button>
      {state.kind === "erro" && (
        <p className="mt-1 text-xs text-red-400">{state.mensagem}</p>
      )}
    </form>
  );
}

function DetalheAberto({
  p,
  oportunidadeId,
  onFechar,
}: {
  p: PropostaHistoricoItem;
  oportunidadeId?: string;
  onFechar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(p.texto_copiavel);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-zinc-900/70 p-3 text-left">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
          Versão {p.versao} · {p.enviada ? "enviada" : "rascunho"}
        </p>
        <button
          type="button"
          onClick={onFechar}
          className="text-[10px] text-zinc-500 hover:text-zinc-300"
        >
          Fechar
        </button>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-300">{p.resumo}</p>

      {p.escopo.length > 0 && (
        <>
          <p className="mt-2 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
            Escopo
          </p>
          <ul className="mt-1 space-y-1.5">
            {p.escopo.map((e, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium text-zinc-200">{e.item}</span>
                <p className="mt-0.5 leading-relaxed text-zinc-400">
                  {e.descricao}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {p.entregaveis.length > 0 && (
        <>
          <p className="mt-2 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
            Entregáveis
          </p>
          <ul className="mt-1 space-y-0.5">
            {p.entregaveis.map((e, i) => (
              <li key={i} className="text-xs text-zinc-300">
                • {e}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-zinc-500">Prazo</span>
        <span className="text-zinc-300">{p.prazo_estimado}</span>
      </div>

      <div className="mt-2 rounded-md border border-primary/30 bg-primary/10 px-2 py-1.5">
        <span className="text-[10px] tracking-wide text-zinc-400 uppercase">
          Investimento sugerido
        </span>
        <p className="font-mono text-sm font-semibold text-primary">
          R$ {milhar(p.faixa_min)} – R$ {milhar(p.faixa_max)}
        </p>
      </div>

      {p.observacoes.trim() ? (
        <p className="mt-2 text-xs text-zinc-400">{p.observacoes}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={copiar} className="btn-ghost">
          {copiado ? "Copiado!" : "Copiar"}
        </button>
        <a href={`/api/propostas/${p.id}/pdf`} className="btn-ghost">
          Baixar PDF
        </a>
        {!p.enviada ? <MarcarEnviada propostaId={p.id} /> : null}
        {oportunidadeId && !p.enviada ? (
          <AplicarValor propostaId={p.id} oportunidadeId={oportunidadeId} />
        ) : null}
        {!p.enviada ? <ExcluirRascunho propostaId={p.id} /> : null}
      </div>
    </div>
  );
}

export function PropostaHistorico({
  propostas,
  oportunidadeId,
}: {
  propostas: PropostaHistoricoItem[];
  oportunidadeId?: string;
}) {
  const [abertaId, setAbertaId] = useState<string | null>(null);

  if (propostas.length === 0) return null;

  return (
    <ul className="space-y-2">
      {propostas.map((p) => {
        const aberta = abertaId === p.id;
        return (
          <li
            key={p.id}
            className="rounded-lg border border-border/60 bg-zinc-900/40 px-3 py-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-zinc-200">
                v{p.versao} · R$ {milhar(p.faixa_min)} – R${" "}
                {milhar(p.faixa_max)}
                {p.enviada ? (
                  <span className="ml-2 text-xs text-emerald-400">enviada</span>
                ) : (
                  <span className="ml-2 text-xs text-zinc-500">rascunho</span>
                )}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAbertaId(aberta ? null : p.id)}
                  className="cursor-pointer text-xs leading-none text-primary hover:underline"
                >
                  {aberta ? "Fechar" : "Abrir"}
                </button>
                <a
                  href={`/api/propostas/${p.id}/pdf`}
                  className="cursor-pointer text-xs leading-none text-primary hover:underline"
                >
                  Baixar PDF
                </a>
                {!p.enviada ? <ExcluirRascunho propostaId={p.id} /> : null}
              </div>
            </div>
            {!aberta && (
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                {p.resumo}
              </p>
            )}
            {aberta ? (
              <DetalheAberto
                p={p}
                oportunidadeId={oportunidadeId}
                onFechar={() => setAbertaId(null)}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
