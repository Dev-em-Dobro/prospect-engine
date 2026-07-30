// F020 — entregável embutido no Orion (sem link externo).

import Link from "next/link";
import { notFound } from "next/navigation";
import { entregavelPorSlug } from "@/lib/entregaveis/catalogo";
import { urlInternaEntregavel } from "@/lib/entregaveis/servir";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function IconeDownload() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-3.5 w-3.5 shrink-0"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export default async function EntregavelPage({ params }: Props) {
  const { slug } = await params;
  const item = entregavelPorSlug(slug);

  if (!item || item.emBreve || !item.pasta) {
    notFound();
  }

  const src = urlInternaEntregavel(item.pasta);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link
          href="/entregaveis"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Materiais
        </Link>
        <span className="text-zinc-600" aria-hidden>
          /
        </span>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-100">
          {item.titulo}
        </h1>
        {item.kitZip ? (
          <a
            href={`/api/entregaveis/download/${item.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            download={item.kitZip.nomeArquivo}
          >
            <IconeDownload />
            Baixar .zip
          </a>
        ) : null}
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
