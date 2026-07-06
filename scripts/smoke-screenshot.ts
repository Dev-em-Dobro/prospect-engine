// Smoke test manual da F008 (provider Playwright). Rodar: npx tsx scripts/smoke-screenshot.ts
import { capturarScreenshots } from "../src/lib/diagnostico-ux/screenshot";

const url = process.argv[2] ?? "https://example.com";

capturarScreenshots(url).then((s) => {
  console.log(
    `OK — desktop: ${Buffer.from(s.desktopB64, "base64").length} bytes | mobile: ${Buffer.from(s.mobileB64, "base64").length} bytes`,
  );
});
