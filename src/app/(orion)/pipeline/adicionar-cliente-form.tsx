"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  criarOportunidadeManual,
  type CriarManualState,
} from "@/actions/pipeline/criar-manual";

const initial: CriarManualState = { kind: "idle" };

export function AdicionarClienteForm() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [state, action, pending] = useActionState(
    criarOportunidadeManual,
    initial,
  );

  useEffect(() => {
    if (state.kind === "ok") {
      setAberto(false);
      router.push(`/pipeline/${state.oportunidadeId}`);
    }
  }, [state, router]);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn-primary"
      >
        + Adicionar cliente
      </button>
    );
  }

  return (
    <form
      action={action}
      className="card w-full max-w-md space-y-3 border-primary/20"
    >
      <p className="text-sm font-semibold text-zinc-100">Novo cliente (manual)</p>
      <label className="block text-xs text-zinc-400">
        Negócio *
        <input
          name="nome_negocio"
          required
          className="mt-1 w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        />
      </label>
      <label className="block text-xs text-zinc-400">
        WhatsApp *
        <input
          name="whatsapp"
          required
          placeholder="5511999998888"
          className="mt-1 w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        />
      </label>
      <label className="block text-xs text-zinc-400">
        Contato
        <input
          name="contato"
          className="mt-1 w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        />
      </label>
      <label className="block text-xs text-zinc-400">
        Cidade
        <input
          name="cidade"
          className="mt-1 w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        />
      </label>
      <label className="block text-xs text-zinc-400">
        Origem
        <select
          name="origem"
          defaultValue="manual"
          className="mt-1 w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        >
          <option value="manual">Manual</option>
          <option value="indicacao">Indicação</option>
        </select>
      </label>
      {state.kind === "erro" && (
        <p className="text-xs text-red-400">{state.mensagem}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Salvando..." : "Criar"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="btn-ghost"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
