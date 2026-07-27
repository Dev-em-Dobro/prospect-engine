"use server";

// F021 — criar Oportunidade manual / indicação.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mensagemEscopo, requireTenant } from "@/lib/db/scoped";
import { criarOportunidadeComPlaybook } from "@/lib/pipeline";

const schema = z.object({
  nome_negocio: z.string().trim().min(1, "Informe o nome do negócio"),
  whatsapp: z.string().trim().min(8, "Informe o WhatsApp"),
  contato: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  nicho: z.string().trim().optional(),
  website: z.string().trim().optional(),
  origem: z.enum(["manual", "indicacao"]).default("manual"),
});

export type CriarManualState =
  | { kind: "idle" }
  | { kind: "ok"; oportunidadeId: string }
  | { kind: "erro"; mensagem: string };

export async function criarOportunidadeManual(
  _prev: CriarManualState,
  formData: FormData,
): Promise<CriarManualState> {
  const parsed = schema.safeParse({
    nome_negocio: formData.get("nome_negocio"),
    whatsapp: formData.get("whatsapp"),
    contato: formData.get("contato") || undefined,
    cidade: formData.get("cidade") || undefined,
    nicho: formData.get("nicho") || undefined,
    website: formData.get("website") || undefined,
    origem: formData.get("origem") || "manual",
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return { kind: "erro", mensagem: msg };
  }

  try {
    const { userId } = await requireTenant();
    const criada = await criarOportunidadeComPlaybook({
      userId,
      nomeNegocio: parsed.data.nome_negocio,
      whatsapp: parsed.data.whatsapp,
      contato: parsed.data.contato ?? null,
      cidade: parsed.data.cidade ?? null,
      nicho: parsed.data.nicho ?? null,
      website: parsed.data.website || null,
      origem: parsed.data.origem,
    });

    revalidatePath("/pipeline");
    return { kind: "ok", oportunidadeId: criada.id };
  } catch (e) {
    const escopo = mensagemEscopo(e);
    if (escopo) return { kind: "erro", mensagem: escopo };
    throw e;
  }
}
