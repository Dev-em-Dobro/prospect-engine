"use client";

import { useActionState } from "react";
import {
  toggleTarefaOportunidade,
  type ToggleTarefaState,
} from "@/actions/pipeline/toggle-tarefa";
import { urlEntregavel } from "@/lib/pipeline";

const initial: ToggleTarefaState = { kind: "idle" };

export function TarefaCheckbox({
  tarefaId,
  concluida,
  titulo,
  entregavelSlug,
}: {
  tarefaId: string;
  concluida: boolean;
  titulo: string;
  entregavelSlug: string | null;
}) {
  const [, action, pending] = useActionState(toggleTarefaOportunidade, initial);
  const link = urlEntregavel(entregavelSlug);

  return (
    <li className="flex items-start gap-2 py-1.5">
      <form action={action} className="shrink-0 pt-0.5">
        <input type="hidden" name="tarefa_id" value={tarefaId} />
        <input
          type="hidden"
          name="concluida"
          value={concluida ? "false" : "true"}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={concluida ? "Desmarcar" : "Marcar"}
          className={`flex h-4 w-4 items-center justify-center rounded border ${
            concluida
              ? "border-primary bg-primary text-[10px] text-primary-foreground"
              : "border-zinc-600 bg-transparent"
          }`}
        >
          {concluida ? "✓" : ""}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${concluida ? "text-zinc-500 line-through" : "text-zinc-200"}`}
        >
          {titulo}
        </p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Abrir entregável →
          </a>
        )}
      </div>
    </li>
  );
}
