// F020 — entregável embutido no Orion (sem link externo).

import Link from "next/link";
import { notFound } from "next/navigation";
import { entregavelPorSlug } from "@/lib/entregaveis/catalogo";
import { urlInternaEntregavel } from "@/lib/entregaveis/servir";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function EntregavelPage({ params }: Props) {
  const { slug } = await params;
  const item = entregavelPorSlug(slug);

  if (!item || item.emBreve || !item.pasta) {
    notFound();
  }

  const src = urlInternaEntregavel(item.pasta);

  return (
    <div className="flex min-h-[calc(100dvh-0px)] flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link
          href="/entregaveis"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Materiais
        </Link>
        <h1 className="truncate text-sm font-semibold text-zinc-100">
          {item.titulo}
        </h1>
      </header>

      <iframe
        src={src}
        title={item.titulo}
        className="min-h-0 w-full flex-1 border-0 bg-[#0b0d10]"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
      />
    </div>
  );
}
