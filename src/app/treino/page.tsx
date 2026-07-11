// F013 — página de treino (roleplay). Server component: oferece Leads como
// cenário (categoria + dores derivadas). Spec: F013-simulador-de-venda.md.

import { prisma } from "@/lib/db";
import { derivarDoDiagnostico } from "@/lib/dores/derivarDoDiagnostico";
import { Simulador } from "./simulador";

export default async function TreinoPage() {
  // Leads já diagnosticados servem de cenário realista (categoria + Dores).
  const leads = await prisma.lead.findMany({
    where: { diagnosticos: { some: {} } },
    orderBy: { score: "desc" },
    take: 50,
    include: { diagnosticos: { orderBy: { executado_em: "desc" }, take: 1 } },
  });

  const opcoes = leads
    .map((l) => {
      const diag = l.diagnosticos[0];
      if (!diag) return null;
      return {
        id: l.id,
        nome: l.nome,
        categoria: l.categoria,
        dores: derivarDoDiagnostico(diag, l.website),
      };
    })
    .filter((o): o is NonNullable<typeof o> => o !== null);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Simulador de venda</h1>
      <p className="mt-1 text-sm text-muted">
        Treine a conversa contra um dono de negócio cético e receba um Scorecard
        no fim. Nada aqui é salvo (F013).
      </p>

      <div className="mt-6">
        <Simulador leads={opcoes} />
      </div>
    </main>
  );
}
