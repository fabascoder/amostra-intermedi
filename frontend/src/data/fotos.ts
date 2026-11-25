// Fotos da equipe (usadas com autorização de cada pessoa). Quem não tem foto
// continua com a inicial do nome no círculo colorido.
import alexandreSantiago from "../assets/equipe/alexandre-santiago.webp";
import ariella from "../assets/equipe/ariella.webp";
import eduardo from "../assets/equipe/eduardo.webp";
import fabricio from "../assets/equipe/fabricio.webp";
import matheus from "../assets/equipe/matheus.webp";

// Nome completo quando há dois com o mesmo primeiro nome (Alexandre Santiago e Alexandre Rafael).
const FOTOS: Record<string, string> = { "alexandre santiago": alexandreSantiago, ariella, eduardo, fabricio, matheus };

const normalizar = (texto: string) => texto.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ");

/** Foto pelo nome completo ou pelo primeiro nome ("Eduardo Viana" -> eduardo), ou null. */
export function fotoDe(nome: string): string | null {
  const completo = normalizar(nome);
  return FOTOS[completo] ?? FOTOS[completo.split(" ")[0]] ?? null;
}
