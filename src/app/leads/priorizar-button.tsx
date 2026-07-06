"use client";

import { useActionState } from "react";
import { priorizarLead, type PriorizarState } from "@/actions/leads/priorizar";

const initial: PriorizarState = { kind: "idle" };

// Definições da spec F003 (score-e-priorizacao).
function AjudaScore() {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="O que significam Score, Valor e Necessidade?"
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-600 text-[10px] font-semibold text-zinc-400 transition-colors duration-200 hover:border-zinc-400 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="invisible absolute top-5 right-0 z-50 w-64 rounded-lg border border-border bg-zinc-900 p-3 text-left text-xs leading-relaxed font-normal text-zinc-300 shadow-lg group-focus-within:visible group-hover:visible"
      >
        <span className="block">
          <strong className="text-zinc-100">Score</strong> — prioridade final
          do Lead (55% Valor + 45% Necessidade).
        </span>
        <span className="mt-2 block">
          <strong className="text-zinc-100">Valor</strong> — o quanto vale
          abordar: tier do nicho (ALTO/MÉDIO/BAIXO) + porte estimado pelo nº de
          avaliações no Google.
        </span>
        <span className="mt-2 block">
          <strong className="text-zinc-100">Necessidade</strong> — o quanto
          precisa de dev, segundo o Diagnóstico: sem site vale 100; site
          lento e sem HTTPS aumentam a nota.
        </span>
      </span>
    </span>
  );
}

export function PriorizarButton({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(priorizarLead, initial);

  return (
    <form action={action}>
      <input type="hidden" name="lead_id" value={leadId} />
      <button type="submit" disabled={pending} className="btn-ghost">
        {pending ? "Priorizando..." : "Priorizar"}
      </button>
      {state.kind === "ok" && (
        <span className="mt-1 flex max-w-56 items-start gap-1.5">
          <p className="text-xs text-emerald-400">{state.resumo}</p>
          <AjudaScore />
        </span>
      )}
      {state.kind === "erro" && (
        <p className="mt-1 max-w-48 text-xs text-red-400">{state.mensagem}</p>
      )}
    </form>
  );
}
