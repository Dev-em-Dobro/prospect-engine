// F013 — schemas Zod da entrada do Simulador (cenário + histórico).
// Compartilhado pelas duas Server Actions (responder/avaliar).

import { z } from "zod";

export const cenarioSchema = z.object({
  categoria: z.string().trim().min(2).max(80),
  dores: z.array(z.string().max(300)).max(10),
  dificuldade: z.enum(["facil", "medio", "dificil"]),
});

export const turnoSchema = z.object({
  papel: z.enum(["aluno", "dono"]),
  texto: z.string().min(1).max(2000),
});

export const entradaSchema = z.object({
  cenario: cenarioSchema,
  historico: z.array(turnoSchema).min(1).max(60),
});
