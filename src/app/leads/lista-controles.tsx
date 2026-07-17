import Link from "next/link";

const PAGE_SIZE = 20;

export { PAGE_SIZE };

function hrefLista(opts: { categoria?: string; page: number }): string {
  const params = new URLSearchParams();
  if (opts.categoria) params.set("categoria", opts.categoria);
  if (opts.page > 1) params.set("page", String(opts.page));
  const q = params.toString();
  return q ? `/leads?${q}` : "/leads";
}

type FiltroCategoriaProps = {
  categorias: string[];
  categoriaAtual: string | null;
};

/** Form GET: muda categoria e volta para a página 1. */
export function FiltroCategoria({
  categorias,
  categoriaAtual,
}: FiltroCategoriaProps) {
  if (categorias.length === 0) return null;

  return (
    <form method="get" action="/leads" className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-zinc-400">
        Categoria
        <select
          name="categoria"
          defaultValue={categoriaAtual ?? ""}
          className="rounded-lg border border-border bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-ghost">
        Filtrar
      </button>
    </form>
  );
}

type PaginacaoProps = {
  page: number;
  totalPages: number;
  total: number;
  categoria: string | null;
};

export function PaginacaoLeads({
  page,
  totalPages,
  total,
  categoria,
}: PaginacaoProps) {
  if (total === 0 || totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;
  const cat = categoria ?? undefined;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {prev ? (
          <Link href={hrefLista({ categoria: cat, page: prev })} className="btn-ghost">
            Anterior
          </Link>
        ) : (
          <span className="btn-ghost pointer-events-none opacity-40">Anterior</span>
        )}
        {next ? (
          <Link href={hrefLista({ categoria: cat, page: next })} className="btn-ghost">
            Próxima
          </Link>
        ) : (
          <span className="btn-ghost pointer-events-none opacity-40">Próxima</span>
        )}
      </div>
    </div>
  );
}
