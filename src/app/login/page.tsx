// F014 — tela de login (Google + magic link).
// Spec: /specs/02-features/F014-autenticacao.md

import { Suspense } from "react";
import { googleAuthEnabled } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-2xl font-semibold tracking-tight">
            prospect <span className="text-primary">engine</span>
          </p>
          <h1 className="text-lg text-zinc-300">Entre na sua conta</h1>
          <p className="text-sm text-zinc-500">
            {googleAuthEnabled
              ? "Google ou link enviado por e-mail — sem senha."
              : "Link enviado por e-mail — sem senha."}
          </p>
        </div>

        <div className="card">
          <Suspense
            fallback={
              <p className="text-sm text-zinc-500">Carregando formulário…</p>
            }
          >
            <LoginForm googleEnabled={googleAuthEnabled} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
