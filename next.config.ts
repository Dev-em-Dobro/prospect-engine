import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  // Playwright (F008/ADR-006) não pode ser bundlado pelo Next — carrega o
  // Chromium em runtime.
  serverExternalPackages: ["playwright"],
};

// ADR-013 — wrap Sentry. Sem SENTRY_AUTH_TOKEN ⇒ dryRun (sem upload de maps).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
