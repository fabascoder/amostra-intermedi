// Serviço demonstrativo de farmácias (dados locais).
import { EQUIPES, FARMACIAS, farmaciaPorId } from "../data/farmacias";
import type { Farmacia } from "../types";

export function listarFarmacias(): Farmacia[] {
  return FARMACIAS;
}

export function farmacia(id: number): Farmacia | undefined {
  return farmaciaPorId.get(id);
}

export function equipe(idFarmacia: number) {
  return EQUIPES[idFarmacia] ?? { gerente: "Gerente", outrosGerentes: [], funcionarios: [] };
}

/** Endereços no formato que o rastreio original usa ({ bairro, cidade, uf } por id). */
export function enderecosParaRastreio(): Record<string, { bairro: string; cidade: string; uf: string }> {
  return Object.fromEntries(FARMACIAS.map((f) => [String(f.idFarmacia), { bairro: f.bairro, cidade: f.cidade, uf: f.uf }]));
}

export const enderecoCompleto = (f: Farmacia) => `${f.rua}, ${f.numero} - ${f.bairro}, ${f.cidade} - ${f.uf}`;

/** Distância em km (fórmula de haversine), como no intermedi-app. */
export function distanciaKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatarKm(km?: number): string {
  if (km === undefined || !Number.isFinite(km)) return "";
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}
