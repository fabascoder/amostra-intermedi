// Lançamento oficial do Intermedi Demo: tudo o que se ajusta para o dia fica aqui.

/**
 * Data e hora do lançamento, no horário de Brasília (-03:00; o Brasil não tem
 * horário de verão). Antes deste instante, qualquer endereço mostra só a
 * contagem; no zero começa a abertura e, depois dela, a plataforma.
 * `null` desliga a camada de lançamento inteira.
 */
export const LANCAMENTO: string | null = "2026-12-01T00:00:00-03:00";

/** Fuso usado para escrever a data e a hora na tela. */
export const FUSO = "America/Sao_Paulo";

/** Textos da contagem e da abertura. */
export const TEXTOS = {
  chamada: "O futuro está prestes a chegar.",
  apoio: "Uma nova forma de conectar a saúde.",
  frase: "Toda transformação começa com uma conexão.",
  /** palavra da frase que a linha sublinha antes de virar rede */
  destaque: "conexão.",
  boasVindas: "Boas-vindas ao Intermedi.",
} as const;
