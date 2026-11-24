// Adaptação dos dados locais para as telas do aplicativo do paciente, com as
// mesmas regras do intermedi-app (utils/medicine-style.ts e
// services/disponibilidade.ts): cor e ícone por categoria, formato do
// comprimido, "exige receita" pela tarja e "poucas unidades" abaixo de 10.
import { ESTOQUE } from "../../data/farmacias";
import { REMEDIOS } from "../../data/remedios";
import { distanciaKm, listarFarmacias } from "../../demoServices/pharmacyService";
import type { Farmacia, Remedio } from "../../types";

/** "cat": categorias, só o texto na cor do mascote. */
export type Tom = "green" | "orange" | "blue" | "purple" | "red" | "amber" | "neutral" | "cat";
export type FormatoComprimido = "round" | "capsule" | "oval";

export const POUCAS_UNIDADES = 10;

/** Onde o paciente demonstrativo está (bairro fictício da demonstração). */
export const LOCAL_PACIENTE = { latitude: -23.5452, longitude: -46.4128, rotulo: "Guaianases, São Paulo" };

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const ESTILOS_CATEGORIA: { match: RegExp; tom: Tom; icone: string }[] = [
  { match: /dor|febre|analg|antiterm|enxaq/, tom: "orange", icone: "thermometer-outline" },
  { match: /gripe|resfri|tosse|respir|nariz|garganta/, tom: "blue", icone: "rainy-outline" },
  { match: /alerg|antihist/, tom: "purple", icone: "flower-outline" },
  { match: /cora|cardi|press|hipert|colest/, tom: "red", icone: "heart-outline" },
  { match: /diabet|glic|insul/, tom: "amber", icone: "water-outline" },
  { match: /estom|gastr|digest|intest|antiac/, tom: "amber", icone: "nutrition-outline" },
  { match: /antibi|infec/, tom: "blue", icone: "shield-checkmark-outline" },
  { match: /inflam|muscul|artic/, tom: "orange", icone: "body-outline" },
  { match: /vitamin|suplem/, tom: "green", icone: "leaf-outline" },
];

export function estiloCategoria(rotulo: string): { tom: Tom; icone: string } {
  const texto = normalizar(rotulo);
  return ESTILOS_CATEGORIA.find((e) => e.match.test(texto)) ?? { tom: "green", icone: "medkit-outline" };
}

export const exigeReceita = (r: Remedio) => r.tarjaRemedio !== "sem_tarja";
export const tituloRemedio = (r: Pick<Remedio, "nomeRemedio" | "dosagemRemedio">) => [r.nomeRemedio, r.dosagemRemedio].filter(Boolean).join(" ");
export const tomPrincipal = (r: Remedio): Tom => estiloCategoria(r.categorias[0] ?? "").tom;

export function formatoComprimido(r: Remedio): FormatoComprimido {
  const forma = normalizar(r.formaFarmaceutica);
  if (/capsul/.test(forma)) return "capsule";
  if (/comprim|dragea|pastilh/.test(forma)) return "round";
  return "oval";
}

/** Receita em palavras simples, para quem vai comprar. */
export function textoReceita(r: Remedio): string {
  if (r.tarjaRemedio === "sem_tarja") return "Não precisa";
  if (r.tarjaRemedio === "vermelha") return "Precisa de receita";
  return "A farmácia fica com a receita";
}

/** "Cuidados" na página do remédio: só o que importa para quem vai tomar. */
export function cuidadosRemedio(r: Remedio): [string, string][] {
  return [
    ["Quem não deve tomar", r.contraindicacoes],
    ["Como guardar", r.armazenamento],
  ];
}

export function categoriasDoCatalogo(): string[] {
  return Array.from(new Set(REMEDIOS.flatMap((r) => r.categorias))).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Categorias mais usadas (a tela inicial mostra as quatro primeiras). */
export function categoriasMaisUsadas(limite = 4): string[] {
  const contagem: Record<string, number> = {};
  REMEDIOS.forEach((r) => r.categorias.forEach((c) => { contagem[c] = (contagem[c] ?? 0) + 1; }));
  return Object.entries(contagem).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limite).map(([c]) => c);
}

const HOJE = new Date().toISOString().slice(0, 10);

export type ItemDisponivel = { farmacia: Farmacia; quantidade: number; distancia: number };

/** Farmácias com o remédio (sem lote vencido), da mais perto para a mais longe. */
export function ondeTem(idRemedio: number): ItemDisponivel[] {
  return ESTOQUE.filter((e) => e.idRemedio === idRemedio && e.quantidade > 0 && e.validade >= HOJE)
    .map((e) => {
      const farmacia = listarFarmacias().find((f) => f.idFarmacia === e.idFarmacia)!;
      return { farmacia, quantidade: e.quantidade, distancia: distanciaKm(LOCAL_PACIENTE, farmacia) };
    })
    .sort((a, b) => a.distancia - b.distancia || b.quantidade - a.quantidade);
}

/** Quantos remédios cada farmácia tem disponíveis. */
export function itensEmEstoque(idFarmacia: number): number {
  return ESTOQUE.filter((e) => e.idFarmacia === idFarmacia && e.quantidade > 0 && e.validade >= HOJE).length;
}

export function estoqueParaPaciente(idFarmacia: number) {
  return ESTOQUE.filter((e) => e.idFarmacia === idFarmacia).map((e) => ({
    ...e,
    remedio: REMEDIOS.find((r) => r.idRemedio === e.idRemedio)!,
    vencido: e.validade < HOJE,
  }));
}

export function farmaciasPorDistancia() {
  return listarFarmacias()
    .map((farmacia) => ({ farmacia, distancia: distanciaKm(LOCAL_PACIENTE, farmacia) }))
    .sort((a, b) => a.distancia - b.distancia);
}
