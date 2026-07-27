// F020 — detalhe de um entregável + link externo.

import Link from "next/link";
import { notFound } from "next/navigation";
import { entregavelPorSlug } from "@/lib/entregaveis";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function EntregavelPage({ params }: Props) {
  const { slug } = await params;
  const item = entregavelPorSlug(slug);

  if (!item || item.emBreve) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/entregaveis"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        ← Materiais
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{item.titulo}</h1>
      <p className="mt-2 text-sm text-muted">{item.descricao}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Abrir material
        </a>
        <Link href="/entregaveis" className="btn-ghost">
          Ver todos
        </Link>
      </div>
    </main>
  );
}
