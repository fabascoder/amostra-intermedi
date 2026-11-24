// Trajeto pelas ruas, como o intermedi-app: o backend dele (sistema-rota do
// intermedi-back-end) pergunta ao Valhalla do OpenStreetMap. A amostra não tem
// backend, então faz a mesma consulta direto do navegador.
import type { Coordenada } from "./tipos";

const VALHALLA_URL = "https://valhalla1.openstreetmap.de";

export type ModoLocomocao = "pedestrian" | "auto" | "motorcycle" | "bicycle";

export const MODOS: { valor: ModoLocomocao; titulo: string; icone: string }[] = [
  { valor: "pedestrian", titulo: "A pé", icone: "walk-outline" },
  { valor: "auto", titulo: "Carro", icone: "car-outline" },
  { valor: "motorcycle", titulo: "Moto", icone: "speedometer-outline" },
  { valor: "bicycle", titulo: "Bike", icone: "bicycle-outline" },
];

export type Rota = {
  geometria: { type: "LineString"; coordinates: Coordenada[] };
  distanciaMetros: number;
  tempoSegundos: number;
};

type Ponto = { latitude: number; longitude: number };

const cache = new Map<string, Promise<Rota>>();

export function calcularRota(origem: Ponto, destino: Ponto, modo: ModoLocomocao): Promise<Rota> {
  const chave = [origem.latitude, origem.longitude, destino.latitude, destino.longitude, modo].join("|");
  const guardada = cache.get(chave);
  if (guardada) return guardada;
  const pedido = (async () => {
    const resposta = await fetch(`${VALHALLA_URL}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locations: [
          { lat: origem.latitude, lon: origem.longitude },
          { lat: destino.latitude, lon: destino.longitude },
        ],
        costing: modo,
        format: "osrm",
        shape_format: "geojson",
        language: "pt-BR",
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resposta.ok) throw new Error("Não foi possível calcular a rota.");
    const dados = await resposta.json();
    const rota = dados.routes?.[0];
    if (!rota || rota.geometry?.type !== "LineString") throw new Error("Nenhuma rota encontrada.");
    return { geometria: rota.geometry, distanciaMetros: rota.distance, tempoSegundos: rota.duration } as Rota;
  })();
  cache.set(chave, pedido);
  pedido.catch(() => cache.delete(chave)); // erro não fica guardado: dá para tentar de novo
  return pedido;
}
