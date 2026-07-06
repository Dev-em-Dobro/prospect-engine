// Mapa leve place_id → site de amostra (demo). Os demos vivem num repo separado
// (pasta demos/), servidos por demos/serve.mjs na porta 4321 — FORA da engine.
// Acoplamento solto de propósito: aqui só guardamos o ponteiro. Quando um demo
// novo for gerado, basta adicionar o place_id → slug aqui.

const BASE = process.env.DEMOS_BASE_URL ?? "http://localhost:4321";

const DEMO_SLUG: Record<string, string> = {
  "ChIJzVxe3jB3GZURZ7vWSj-8S1Q": "ono-clinica", // Ono Clínica Estética
  "ChIJA8potsR5GZURLdAgQYkJ-Mk": "el-cartel", // El Cartel Barbearia
  "ChIJbRwXFjl4GZURnej0v50ZVro": "bruno-mattos", // Bruno Mattos Barbeiro
  "ChIJCSq6iR95GZUROFMpsoAj7VE": "kerols-co", // Kerols & Co
  "ChIJNauS7_J5GZURV_dhpl8uFMg": "dra-ellen", // Dra. Ellen Santa Cruz
};

/** URL do site de amostra do Lead, ou null se ainda não houver demo. */
export function demoUrlFor(placeId: string): string | null {
  const slug = DEMO_SLUG[placeId];
  return slug ? `${BASE}/${slug}` : null;
}
