// F016 + F017 — Configuração BYOK + provedor de IA.

import { listarVisaoChaves } from "@/lib/chaves";
import { obterProviderLlm } from "@/lib/llm";
import { requireTenant } from "@/lib/db/scoped";
import { ChaveCard } from "./chave-card";
import { ProviderLlmForm } from "./provider-llm-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracaoPage() {
  const { userId } = await requireTenant();
  const [chaves, provider] = await Promise.all([
    listarVisaoChaves(userId),
    obterProviderLlm(userId),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Configuração</h1>
      <p className="mt-1 text-sm text-muted">
        Cole as suas chaves de API e escolha o provedor de IA. As chaves ficam
        cifradas; o custo das chamadas é da sua conta nos provedores.
      </p>

      <div className="mt-8 space-y-4">
        <ProviderLlmForm atual={provider} />
        {chaves.map((c) => (
          <ChaveCard key={c.tipo} inicial={c} />
        ))}
      </div>

      <p className="mt-8 text-xs text-zinc-500">
        Essenciais: <strong className="text-zinc-400">Google</strong> (coleta +
        diagnóstico) e a chave do{" "}
        <strong className="text-zinc-400">provedor de IA ativo</strong>.
        ScreenshotOne é opcional em local; em produção serverless ela é
        necessária pro Diagnóstico UX.
      </p>
    </main>
  );
}
