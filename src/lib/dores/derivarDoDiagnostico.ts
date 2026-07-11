// Deriva as Dores em linguagem natural a partir do último Diagnóstico.
// Fonte compartilhada: até a F004 existir, lê o Diagnóstico direto (mesmos fatos
// das Dores). Puro, sem dependência de Next — testável isolado.
// Criado na F012 (/specs/02-features/F012-gerador-de-proposta.md); a F011 reusa.

export type DiagnosticoParaDores = {
  tem_site: boolean;
  // F009: só Agregador/perfil social ⇒ não há site próprio.
  site_e_agregador: boolean;
  tem_https: boolean | null;
  performance_mobile: number | null;
};

/** Problemas concretos do Lead em linguagem natural, prontos pro prompt. */
export function derivarDoDiagnostico(
  diag: DiagnosticoParaDores,
  website: string | null,
): string[] {
  if (!website || !diag.tem_site) {
    return ["não tem site / presença digital própria"];
  }
  if (diag.site_e_agregador) {
    return ["só tem link-in-bio / rede social, sem site próprio"];
  }

  const dores: string[] = [];
  if (diag.performance_mobile !== null && diag.performance_mobile < 50) {
    dores.push(
      `site muito lento no celular (nota ${diag.performance_mobile}/100 no Google PageSpeed)`,
    );
  }
  if (diag.tem_https === false) {
    dores.push("site sem HTTPS (sem cadeado de segurança)");
  }
  return dores;
}
