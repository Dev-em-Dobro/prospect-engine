"use server";

// F007 — Sugestões de Vídeo-Funil.
// Spec: /specs/02-features/F007-sugestoes-video-funil.md

import { z } from "zod";
import { sugerirVideos, ConteudoError } from "@/lib/conteudo/sugerirVideos";
import type { IdeiaVideo } from "@/lib/conteudo/prompt";

const schema = z.object({
  tema: z
    .string()
    .trim()
    .min(2, "Tema precisa ter ao menos 2 caracteres")
    .max(120, "Tema muito longo"),
});

export type SugerirState =
  | { kind: "idle" }
  | { kind: "ok"; ideias: IdeiaVideo[] }
  | { kind: "erro"; mensagem: string };

export async function sugerirVideosAction(
  _prev: SugerirState,
  formData: FormData,
): Promise<SugerirState> {
  const parsed = schema.safeParse({ tema: formData.get("tema") });
  if (!parsed.success) {
    const primeiro = parsed.error.issues[0];
    return { kind: "erro", mensagem: primeiro?.message ?? "Input inválido" };
  }

  // Falha de configuração detectada antes de qualquer chamada.
  if (!process.env.ANTHROPIC_API_KEY) {
    return { kind: "erro", mensagem: "ANTHROPIC_API_KEY não configurada" };
  }

  try {
    const ideias = await sugerirVideos(parsed.data.tema);
    return { kind: "ok", ideias };
  } catch (e) {
    if (e instanceof ConteudoError) {
      return { kind: "erro", mensagem: e.message };
    }
    return { kind: "erro", mensagem: "Falha ao gerar ideias. Tente novamente." };
  }
}
