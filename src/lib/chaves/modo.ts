// F018 — modo Orion (chaves do servidor) vs BYOK (chaves do aluno).

import type { KeyMode } from "@prisma/client";
import { prisma } from "@/lib/db";

function asKeyMode(raw: string | null | undefined): KeyMode {
  return raw === "byok" ? "byok" : "orion";
}

async function garantirRow(userId: string) {
  return prisma.userApiKeys.upsert({
    where: { user_id: userId },
    create: { user_id: userId },
    update: {},
  });
}

export async function obterModoChave(userId: string): Promise<KeyMode> {
  const row = await prisma.userApiKeys.findUnique({
    where: { user_id: userId },
    select: { key_mode: true },
  });
  return asKeyMode(row?.key_mode);
}

export async function salvarModoChave(
  userId: string,
  modo: KeyMode,
): Promise<KeyMode> {
  await garantirRow(userId);
  const row = await prisma.userApiKeys.update({
    where: { user_id: userId },
    data: { key_mode: modo },
    select: { key_mode: true },
  });
  return row.key_mode;
}

export const LABEL_KEY_MODE: Record<KeyMode, string> = {
  orion: "Orion (chaves incluídas)",
  byok: "BYOK (suas chaves)",
};
