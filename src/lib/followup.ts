import type { Lead, Outreach } from "@prisma/client";

// F006 — fila de follow-up: contatados há +N dias desde o último envio.
export const FOLLOWUP_DIAS = 3;

// Espera `outreaches` já filtrado (enviado = true, mais recente primeiro, take 1).
export function filaDeFollowUp<T extends Lead & { outreaches: Outreach[] }>(
  leads: T[],
  agora: number = Date.now(),
): { lead: T; dias: number }[] {
  return leads.flatMap((lead) => {
    const ultimoEnvio = lead.outreaches[0]?.enviado_em;
    if (lead.status !== "contatado" || !ultimoEnvio) return [];
    const dias = Math.floor((agora - ultimoEnvio.getTime()) / 86_400_000);
    return dias >= FOLLOWUP_DIAS ? [{ lead, dias }] : [];
  });
}
