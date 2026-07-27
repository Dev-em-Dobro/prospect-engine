"use client";

import { useActionState } from "react";
import {
  atualizarValorOportunidade,
  marcarGanhoOportunidade,
  marcarPerdidoOportunidade,
  type StatusOppState,
} from "@/actions/pipeline/status";

const idle: StatusOppState = { kind: "idle" };

export function ValorForm({
  oportunidadeId,
  valorAtual,
}: {
  oportunidadeId: string;
  valorAtual: number | null;
}) {
  const [state, action, pending] = useActionState(
    atualizarValorOportunidade,
    idle,
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="oportunidade_id" value={oportunidadeId} />
      <label className="text-xs text-zinc-400">
        Valor (R$)
        <input
          name="valor"
          type="number"
          step="0.01"
          min="0"
          defaultValue={valorAtual ?? ""}
          className="mt-1 block w-32 rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        />
      </label>
      <button type="submit" disabled={pending} className="btn-ghost">
        {pending ? "..." : "Salvar"}
      </button>
      {state.kind === "erro" && (
        <p className="w-full text-xs text-red-400">{state.mensagem}</p>
      )}
    </form>
  );
}

export function GanhoPerdidoForms({
  oportunidadeId,
  valorAtual,
}: {
  oportunidadeId: string;
  valorAtual: number | null;
}) {
  const [ganhoState, ganhoAction, ganhoPending] = useActionState(
    marcarGanhoOportunidade,
    idle,
  );
  const [perdidoState, perdidoAction, perdidoPending] = useActionState(
    marcarPerdidoOportunidade,
    idle,
  );

  return (
    <div className="space-y-4">
      <form action={ganhoAction} className="card space-y-2 border-emerald-500/20">
        <p className="text-xs font-semibold text-emerald-400 uppercase">Ganho</p>
        <input type="hidden" name="oportunidade_id" value={oportunidadeId} />
        <label className="block text-xs text-zinc-400">
          Valor fechado (R$)
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={valorAtual ?? ""}
            className="mt-1 w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>
        {ganhoState.kind === "erro" && (
          <p className="text-xs text-red-400">{ganhoState.mensagem}</p>
        )}
        <button
          type="submit"
          disabled={ganhoPending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          {ganhoPending ? "Salvando..." : "Marcar como ganho"}
        </button>
      </form>

      <form action={perdidoAction} className="card space-y-2 border-red-500/20">
        <p className="text-xs font-semibold text-red-400 uppercase">Perdido</p>
        <input type="hidden" name="oportunidade_id" value={oportunidadeId} />
        <label className="block text-xs text-zinc-400">
          Motivo
          <input
            name="motivo"
            required
            className="mt-1 w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>
        {perdidoState.kind === "erro" && (
          <p className="text-xs text-red-400">{perdidoState.mensagem}</p>
        )}
        <button
          type="submit"
          disabled={perdidoPending}
          className="rounded-md bg-red-700/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
        >
          {perdidoPending ? "Salvando..." : "Marcar como perdido"}
        </button>
      </form>
    </div>
  );
}
