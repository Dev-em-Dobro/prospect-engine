"use client";

import { useActionState, useRef } from "react";
import {
  adicionarNotaOportunidade,
  type AdicionarNotaState,
} from "@/actions/pipeline/adicionar-nota";

const initial: AdicionarNotaState = { kind: "idle" };

export function NotaForm({ oportunidadeId }: { oportunidadeId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: AdicionarNotaState, fd: FormData) => {
      const next = await adicionarNotaOportunidade(prev, fd);
      if (next.kind === "ok") formRef.current?.reset();
      return next;
    },
    initial,
  );

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="oportunidade_id" value={oportunidadeId} />
      <textarea
        name="corpo"
        required
        rows={3}
        placeholder="O que o cliente respondeu, combinados..."
        className="w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
      />
      {state.kind === "erro" && (
        <p className="text-xs text-red-400">{state.mensagem}</p>
      )}
      <button type="submit" disabled={pending} className="btn-ghost">
        {pending ? "Salvando..." : "Adicionar nota"}
      </button>
    </form>
  );
}
