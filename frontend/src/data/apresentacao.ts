// Imagens dos slides (os dados ficam em apresentacaoDados.ts).
export { PERIODOS, faixaDeSlides, rotuloDoSlide, type Periodo, type Slide } from "./apresentacaoDados";

const IMAGENS = import.meta.glob("../assets/slides/*.webp", { eager: true, import: "default", query: "?url" }) as Record<string, string>;

/** URL da imagem do slide (mini = miniatura de 480 px); undefined se ainda não foi enviada. */
export function imagemDoSlide(arquivo: string | undefined, mini = false): string | undefined {
  if (!arquivo) return undefined;
  return IMAGENS[`../assets/slides/${arquivo}${mini ? "-mini" : ""}.webp`];
}
