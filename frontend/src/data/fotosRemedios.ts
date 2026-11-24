// Fotos reais dos remédios, as mesmas do intermedi-back-end
// (database/fotos-padrao/remedio-*.webp), reduzidas para 480 px.
// Remédio sem foto (ex.: Cetirizina) continua com a ilustração da caixa.
const ARQUIVOS = import.meta.glob("../assets/remedios/*.webp", { eager: true, import: "default" }) as Record<string, string>;

const POR_NOME = new Map(
  Object.entries(ARQUIVOS).map(([caminho, url]) => [caminho.split("/").pop()!.replace(".webp", ""), url]),
);

const chave = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** "Losartana Potássica" → foto de losartana; "Vitamina C" → vitamina-c. */
export function fotoDoRemedio(nome: string | undefined | null): string | null {
  if (!nome) return null;
  const k = chave(nome);
  return POR_NOME.get(k) ?? POR_NOME.get(k.split("-")[0]) ?? null;
}
