// F014 / ADR-010 — e-mail transacional.
// Produção: Resend. Dev local: Mailpit (Docker Compose) via API HTTP.

import { Resend } from "resend";
import { requireAuthEnv } from "@/lib/auth/env";

type EmailProvider = "mailpit" | "resend";

function getProvider(): EmailProvider {
  const raw = requireAuthEnv("EMAIL_PROVIDER");
  if (raw === "mailpit" || raw === "resend") return raw;
  throw new Error(
    `[email] EMAIL_PROVIDER inválido: "${raw}". Use "mailpit" (local) ou "resend" (produção).`,
  );
}

function buildMagicLinkBody(url: string): { text: string; html: string } {
  const text = [
    "Olá,",
    "",
    "Use o link abaixo para entrar no prospect engine (válido por poucos minutos):",
    "",
    url,
    "",
    "Se você não pediu este acesso, ignore este e-mail.",
  ].join("\n");

  const html = `
      <p>Olá,</p>
      <p>Use o link abaixo para entrar no <strong>prospect engine</strong>
      (válido por poucos minutos):</p>
      <p><a href="${url}">Entrar no prospect engine</a></p>
      <p style="color:#71717a;font-size:13px">Se você não pediu este acesso, ignore este e-mail.</p>
    `.trim();

  return { text, html };
}

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(requireAuthEnv("RESEND_API_KEY"));
  }
  return resend;
}

async function sendViaMailpit(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const base = (
    process.env.MAILPIT_URL?.trim() || "http://127.0.0.1:8025"
  ).replace(/\/$/, "");

  const res = await fetch(`${base}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: { Email: params.from },
      To: [{ Email: params.to }],
      Subject: params.subject,
      Text: params.text,
      HTML: params.html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `[email] Mailpit falhou (${res.status}): ${detail || res.statusText}. ` +
        `Suba com: docker compose up -d`,
    );
  }
}

async function sendViaResend(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const { error } = await getResend().emails.send({
    from: params.from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });

  if (error) {
    throw new Error(`[email] Falha ao enviar magic link: ${error.message}`);
  }
}

export async function sendMagicLinkEmail(params: {
  to: string;
  url: string;
}): Promise<void> {
  const from = requireAuthEnv("EMAIL_FROM");
  const subject = "Seu link de acesso — prospect engine";
  const { text, html } = buildMagicLinkBody(params.url);
  const payload = { to: params.to, from, subject, text, html };

  if (getProvider() === "mailpit") {
    await sendViaMailpit(payload);
    return;
  }

  await sendViaResend(payload);
}
