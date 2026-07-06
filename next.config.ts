import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  // Playwright (F008/ADR-006) não pode ser bundlado pelo Next — carrega o
  // Chromium em runtime.
  serverExternalPackages: ["playwright"],
};

export default nextConfig;
