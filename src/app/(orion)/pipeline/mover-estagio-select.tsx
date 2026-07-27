"use client";

import { useActionState } from "react";
import type { EstagioOportunidade } from "@prisma/client";
import {
  moverEstagioOportunidade,
  type MoverEstagioState,
} from "@/actions/pipeline/mover-estagio";
import { ESTAGIOS_BOARD, LABEL_ESTAGIO } from "@/lib/pipeline";

const initial: MoverEstagioState = { kind: "idle" };

export function MoverEstagioSelect({
  oportunidadeId,
  estagioAtual,
  compact,
}: {
  oportunidadeId: string;
  estagioAtual: EstagioOportunidade;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(
    moverEstagioOportunidade,
    initial,
  );

  return (
    <form action={action} className={compact ? "inline" : "w-full"}>
      <input type="hidden" name="oportunidade_id" value={oportunidadeId} />
      <select
        name="estagio"
        defaultValue={estagioAtual}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={
          compact
            ? "max-w-full rounded border border-border bg-zinc-900 px-1.5 py-1 text-[11px] text-zinc-200"
            : "w-full rounded-md border border-border bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        }
        aria-label="Mudar estágio"
      >
        {ESTAGIOS_BOARD.map((e) => (
          <option key={e} value={e}>
            {LABEL_ESTAGIO[e]}
          </option>
        ))}
      </select>
      {state.kind === "erro" && (
        <p className="mt-1 text-xs text-red-400">{state.mensagem}</p>
      )}
    </form>
  );
}
