// Boot do Node — valida secrets críticos antes de servir tráfego.
// Next.js chama `register` automaticamente (instrumentation).

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Evita falhar o `next build` quando o ambiente de CI ainda não tem secrets;
  // em runtime (dev/prod) e no /api/health a checagem é obrigatória.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { assertCriticalSecrets } = await import(
    "@/lib/seguranca/env-servidor"
  );
  assertCriticalSecrets();
}
