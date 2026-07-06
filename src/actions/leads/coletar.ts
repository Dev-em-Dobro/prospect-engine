"use server";

// F001 — coleta de Leads via Google Places.
// Spec: /specs/02-features/F001-coleta-de-leads.md

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PlacesError, textSearch } from "@/lib/places/textSearch";

const schema = z.object({
  termo: z
    .string()
    .trim()
    .min(2, "Termo precisa ter ao menos 2 caracteres")
    .max(80, "Termo muito longo"),
  localizacao: z
    .string()
    .trim()
    .min(2, "Localização precisa ter ao menos 2 caracteres")
    .max(80, "Localização muito longa"),
});

export type ColetarState =
  | { kind: "idle" }
  | { kind: "ok"; criados: number; ignorados: number }
  | { kind: "erro"; mensagem: string };

export async function coletarLeads(
  _prev: ColetarState,
  formData: FormData,
): Promise<ColetarState> {
  const parsed = schema.safeParse({
    termo: formData.get("termo"),
    localizacao: formData.get("localizacao"),
  });

  if (!parsed.success) {
    const primeiro = parsed.error.issues[0];
    return { kind: "erro", mensagem: primeiro?.message ?? "Input inválido" };
  }

  const query = `${parsed.data.termo} em ${parsed.data.localizacao}`;

  try {
    const resultados = await textSearch(query);

    // status=novo e score=0 são defaults do schema Prisma.
    // skipDuplicates: conflito em place_id (unique) é ignorado.
    const { count: criados } = await prisma.lead.createMany({
      data: resultados.map((p) => ({
        nome: p.nome,
        endereco: p.endereco,
        telefone: p.telefone,
        website: p.website,
        categoria: p.categoria,
        nota: p.nota,
        num_avaliacoes: p.num_avaliacoes,
        place_id: p.id,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/leads");
    return { kind: "ok", criados, ignorados: resultados.length - criados };
  } catch (e) {
    if (e instanceof PlacesError) {
      const detalhe = e.message.slice(0, 300);
      return {
        kind: "erro",
        mensagem:
          e.status === 0 ? detalhe : `Places API (${e.status}): ${detalhe}`,
      };
    }
    return {
      kind: "erro",
      mensagem: e instanceof Error ? e.message : "Erro desconhecido",
    };
  }
}
