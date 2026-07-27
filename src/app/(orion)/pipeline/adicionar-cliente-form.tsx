"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  criarOportunidadeManual,
  type CriarManualState,
} from "@/actions/pipeline/criar-manual";

const initial: CriarManualState = { kind: "idle" };

export function AdicionarClienteForm() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, action, pending] = useActionState(
    criarOportunidadeManual,
    initial,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state.kind === "ok") {
      setAberto(false);
      router.push(`/pipeline/${state.oportunidadeId}`);
    }
  }, [state, router]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  const modal =
    aberto && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label="Novo cliente (manual)"
            onClick={() => setAberto(false)}
          >
            <div
              className="my-8 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-border p-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Novo cliente
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">
                    Cadastro manual fora da busca de Leads.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className="rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                >
                  ✕
                </button>
              </div>

              <form action={action} className="space-y-3 p-5">
                <label className="block text-xs text-zinc-400">
                  Negócio *
                  <input
                    name="nome_negocio"
                    required
                    autoFocus
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
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={pending}
                    className="btn-primary"
                  >
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
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="btn-primary"
      >
        + Adicionar cliente
      </button>
      {modal}
    </>
  );
}
