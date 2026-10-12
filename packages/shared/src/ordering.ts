import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

/**
 * Posições de cartões/colunas usam índices fracionários (strings ordenáveis).
 * Mover um item altera apenas a posição dele, evitando conflitos entre dispositivos.
 */
export function positionBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after);
}

export function initialPositions(count: number): string[] {
  return generateNKeysBetween(null, null, count);
}
