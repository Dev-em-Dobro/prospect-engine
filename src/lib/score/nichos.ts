// F003 — Mapa nicho → Tier. Fonte única: /specs/05-playbook/nichos-alto-valor.md.
// Mudar a classificação de um nicho é mudança de estratégia → editar o playbook antes.

export type Tier = "ALTO" | "MEDIO" | "BAIXO";

// `categoria` vem do Places (primaryType). Confirmar contra o que a API
// devolve e ajustar o playbook quando aparecer tipo não previsto.
const ALTO = new Set<string>([
  "dentist",
  "dental_clinic",
  "skin_care_clinic",
  "dermatologist",
  "doctor",
  "medical_clinic",
  "physiotherapist",
  "psychologist",
  "nutritionist",
  "veterinary_care",
  "lawyer",
  "accounting",
  "architect",
  "real_estate_agency",
]);

const MEDIO = new Set<string>([
  "restaurant",
  "cafe",
  "gym",
  "fitness_center",
  "hair_salon",
  "barber_shop",
  "spa",
  "pet_store",
  "optician",
  "school",
  "car_repair",
]);

/** Classifica a categoria do Lead. Não mapeada → BAIXO (conservador). */
export function tierDoNicho(categoria: string): Tier {
  const c = categoria.toLowerCase();
  if (ALTO.has(c)) return "ALTO";
  if (MEDIO.has(c)) return "MEDIO";
  return "BAIXO";
}
