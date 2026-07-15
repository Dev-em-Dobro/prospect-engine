// F016 — Configuração de chaves BYOK do aluno.

import { listarVisaoChaves } from "@/lib/chaves";
import { requireTenant } from "@/lib/db/scoped";
import { ChaveCard } from "./chave-card";

export const dynamic = "force-dynamic";

export default async function ConfiguracaoPage() {
  const { userId } = await requireTenant();
  const chaves = await listarVisaoChaves(userId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Configuração</h1>
      <p className="mt-1 text-sm text-muted">
        Cole as suas chaves de API. Elas ficam cifradas no banco; o custo das
        chamadas é da sua conta nos provedores. Nunca mostramos o valor em
        claro — só uma máscara e o status.
      </p>

      <div className="mt-8 space-y-4">
        {chaves.map((c) => (
          <ChaveCard key={c.tipo} inicial={c} />
        ))}
      </div>

      <p className="mt-8 text-xs text-zinc-500">
        Essenciais pro app: <strong className="text-zinc-400">Google</strong>{" "}
        (coleta + diagnóstico) e{" "}
        <strong className="text-zinc-400">Anthropic</strong> (Outreach, IA).
        ScreenshotOne é opcional em local; em produção serverless ela é
        necessária pro Diagnóstico UX. OpenAI/Gemini ficam guardadas pra uso
        futuro.
      </p>
    </main>
  );
}
