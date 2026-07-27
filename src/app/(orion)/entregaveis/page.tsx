// F020 — visão geral dos entregáveis.

import Link from "next/link";
import { ENTREGAVEIS } from "@/lib/entregaveis";

export const dynamic = "force-dynamic";

export default function EntregaveisPage() {
  const disponiveis = ENTREGAVEIS.filter((e) => !e.emBreve);
  const emBreve = ENTREGAVEIS.filter((e) => e.emBreve);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Materiais</h1>
      <p className="mt-1 text-sm text-muted">
        Tudo o que você recebe na Consultoria Freela, num lugar só.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Disponível agora</h2>
        <ul className="space-y-3">
          {disponiveis.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/entregaveis/${item.slug}`}
                className="card block transition-colors hover:border-primary/30"
              >
                <p className="font-medium text-zinc-100">{item.titulo}</p>
                <p className="mt-1 text-sm text-muted">{item.descricao}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {emBreve.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500">Em breve</h2>
          <ul className="space-y-3">
            {emBreve.map((item) => (
              <li
                key={item.slug}
                className="card border-zinc-800/60 opacity-60"
              >
                <p className="font-medium text-zinc-400">{item.titulo}</p>
                <p className="mt-1 text-sm text-zinc-500">{item.descricao}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
