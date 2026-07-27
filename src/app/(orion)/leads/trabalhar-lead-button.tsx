"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  criarOportunidadeDeLead,
  type CriarDeLeadState,
} from "@/actions/pipeline/criar-de-lead";

const initial: CriarDeLeadState = { kind: "idle" };

export function TrabalharLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    criarOportunidadeDeLead,
    initial,
  );

  useEffect(() => {
    if (state.kind === "ok") {
      router.push(`/pipeline/${state.oportunidadeId}`);
    }
  }, [state, router]);

  return (
    <form action={action}>
      <input type="hidden" name="lead_id" value={leadId} />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adicionando..." : "Trabalhar este lead"}
      </button>
      {state.kind === "ok" && state.jaExistia && (
        <p className="mt-1 max-w-48 text-xs text-amber-300">
          Já estava no pipeline — abrindo.
        </p>
      )}
      {state.kind === "ok" && !state.jaExistia && (
        <p className="mt-1 max-w-48 text-xs text-emerald-400">
          Adicionado ao pipeline.
        </p>
      )}
      {state.kind === "erro" && (
        <p className="mt-1 max-w-48 text-xs text-red-400">{state.mensagem}</p>
      )}
    </form>
  );
}
