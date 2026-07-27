"use client";

import { useActionState } from "react";
import {
  verificarCompraAction,
  type AtivarActionState,
} from "@/actions/compra/ativar";

const idle: AtivarActionState = { kind: "idle" };

export function AtivarAcessoForm({
  emailLogin,
  emailCompra,
  checkoutUrl,
}: {
  emailLogin: string;
  emailCompra: string | null;
  checkoutUrl: string | null;
}) {
  const [state, action, pending] = useActionState(verificarCompraAction, idle);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email-login" className="text-sm font-medium text-zinc-300">
          E-mail de acesso
        </label>
        <input
          id="email-login"
          type="email"
          value={emailLogin}
          readOnly
          className="input cursor-not-allowed opacity-70"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-300">
          E-mail da compra na Hubla
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="mesmo e-mail usado na compra"
          defaultValue={emailCompra ?? ""}
          className="input"
        />
        <p className="text-xs text-zinc-500">
          Use o e-mail cadastrado na Hubla ao comprar o Builders Club. Pode ser
          diferente do e-mail de login.
        </p>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Verificando…" : "Verificar compra"}
      </button>

      {state.kind === "erro" && (
        <div className="space-y-3">
          <p className="alert-erro text-sm">{state.mensagem}</p>
          {checkoutUrl ? (
            <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 p-4">
              <p className="text-sm font-medium text-zinc-200">
                Ainda não comprou o Builders Club?
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Finalize a compra na Hubla e volte aqui com o mesmo e-mail do
                checkout para liberar os entregáveis.
              </p>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost mt-3 inline-flex w-full justify-center border border-primary/40 text-primary hover:bg-primary/10"
              >
                Comprar Builders Club
              </a>
            </div>
          ) : null}
        </div>
      )}

      {state.kind !== "erro" && checkoutUrl ? (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 text-center">
          <p className="text-sm text-zinc-400">Ainda não é aluno?</p>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ver oferta do Builders Club →
          </a>
        </div>
      ) : null}
    </form>
  );
}
