// F008 — captura de screenshots (desktop + mobile) do site de um Lead.
// Provider primário: Playwright local (Chromium headless). Alternativo:
// ScreenshotOne, ativado quando SCREENSHOTONE_ACCESS_KEY está definida
// (deploy serverless). Decisão: ADR-006.
// Contrato do provider externo: /specs/03-contracts/screenshotone.md
// Lança ScreenshotError; quem traduz pra UI é a Server Action.

import type { Browser } from "playwright";

export class ScreenshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScreenshotError";
  }
}

/** Screenshots JPEG em base64. */
export type Screenshots = { desktopB64: string; mobileB64: string };

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };
const TIMEOUT_PAGINA_MS = 30_000;

/** Captura os screenshots desktop e mobile da URL. */
export async function capturarScreenshots(url: string): Promise<Screenshots> {
  return process.env.SCREENSHOTONE_ACCESS_KEY
    ? viaScreenshotOne(url)
    : viaPlaywright(url);
}

// --- Provider primário: Playwright (Fase 1, local) -----------------------

async function viaPlaywright(url: string): Promise<Screenshots> {
  // Import dinâmico: a lib (e o Chromium) só carregam quando este provider
  // é usado — em deploy com ScreenshotOne o Playwright nem precisa existir.
  const { chromium, devices } = await import("playwright");

  let browser: Browser;
  try {
    browser = await chromium.launch();
  } catch {
    throw new ScreenshotError(
      "Chromium do Playwright não instalado — rode: npx playwright install chromium",
    );
  }

  try {
    const [desktopB64, mobileB64] = await Promise.all([
      capturarPagina(browser, url, { viewport: DESKTOP }),
      capturarPagina(browser, url, devices["iPhone 13"]),
    ]);
    return { desktopB64, mobileB64 };
  } finally {
    await browser.close();
  }
}

async function capturarPagina(
  browser: Browser,
  url: string,
  contextOptions: Parameters<Browser["newContext"]>[0],
): Promise<string> {
  const context = await browser.newContext(contextOptions);
  try {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "load", timeout: TIMEOUT_PAGINA_MS });
    } catch {
      throw new ScreenshotError(
        "Site fora do ar ou demorou demais pra carregar",
      );
    }
    // Respiro pra fontes e animações de entrada assentarem.
    await page.waitForTimeout(1500);
    const buf = await page.screenshot({ type: "jpeg", quality: 80 });
    return buf.toString("base64");
  } finally {
    await context.close();
  }
}

// --- Provider alternativo: ScreenshotOne (deploy serverless) -------------

async function viaScreenshotOne(url: string): Promise<Screenshots> {
  const [desktopB64, mobileB64] = await Promise.all([
    fetchScreenshotOne(url, DESKTOP, "desktop"),
    fetchScreenshotOne(url, MOBILE, "mobile"),
  ]);
  return { desktopB64, mobileB64 };
}

async function fetchScreenshotOne(
  url: string,
  viewport: { width: number; height: number },
  rotulo: string,
): Promise<string> {
  const params = new URLSearchParams({
    access_key: process.env.SCREENSHOTONE_ACCESS_KEY!,
    url,
    viewport_width: String(viewport.width),
    viewport_height: String(viewport.height),
    format: "jpg",
    image_quality: "80",
    block_cookie_banners: "true",
    block_ads: "true",
    timeout: "30",
  });

  let res: Response;
  try {
    res = await fetch(`https://api.screenshotone.com/take?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT_PAGINA_MS + 10_000),
    });
  } catch {
    throw new ScreenshotError(
      `Falha ao capturar screenshot (${rotulo}) — site fora do ar ou timeout`,
    );
  }

  if (!res.ok) {
    throw new ScreenshotError(
      `ScreenshotOne retornou ${res.status} pro screenshot ${rotulo}`,
    );
  }

  return Buffer.from(await res.arrayBuffer()).toString("base64");
}
