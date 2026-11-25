// Fotos da equipe (usadas com autorização de cada pessoa). Quem não tem foto
// continua com a inicial do nome no círculo colorido.
import ariella from "../assets/equipe/ariella.webp";
import eduardo from "../assets/equipe/eduardo.webp";

const FOTOS: Record<string, string> = { ariella, eduardo };

/** Foto pelo primeiro nome ("Eduardo Viana" -> eduardo), ou null. */
export function fotoDe(nome: string): string | null {
  const primeiro = nome.trim().split(/\s+/)[0]?.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() ?? "";
  return FOTOS[primeiro] ?? null;
}
