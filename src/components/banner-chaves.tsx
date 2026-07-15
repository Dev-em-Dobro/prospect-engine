import Link from "next/link";
import {
  LABEL_CHAVE,
  chavesEssenciaisFaltando,
  type TipoChave,
} from "@/lib/chaves";
import { requireTenant } from "@/lib/db/scoped";

/** Banner de onboarding quando faltam Google ou Anthropic (F016). */
export async function BannerChaves() {
  const { userId } = await requireTenant();
  const faltando = await chavesEssenciaisFaltando(userId);
  if (faltando.length === 0) return null;

  const nomes = faltando
    .map((t: TipoChave) => LABEL_CHAVE[t])
    .join(" e ");

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm text-amber-100">
      Falta configurar {nomes}.{" "}
      <Link
        href="/configuracao"
        className="font-semibold text-amber-50 underline underline-offset-2 hover:text-white"
      >
        Ir para /configuracao
      </Link>
    </div>
  );
}
