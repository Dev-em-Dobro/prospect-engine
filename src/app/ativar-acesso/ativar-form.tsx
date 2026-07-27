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
}: {
  emailLogin: string;
  emailCompra: string | null;
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
        <p className="alert-erro text-sm">{state.mensagem}</p>
      )}
    </form>
  );
}
