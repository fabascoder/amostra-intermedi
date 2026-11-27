// Lançamento da amostra: até LANCAMENTO (config/demo.ts), todo endereço mostra
// só a contagem regressiva. A hora vem do relógio do aparelho, então o app abre
// sozinho no segundo exato, sem novo deploy.
//
// Prévia da equipe: abrir o endereço com ?previa=CODIGO (o mesmo código da
// reativação) libera o app neste navegador antes do lançamento. Como a
// reativação, é uma barreira de interface, não uma senha de verdade.
// Em desenvolvimento, ?lancamento-em=SEGUNDOS simula um lançamento daqui a
// alguns segundos, para testar a virada.
import { LANCAMENTO } from "../config/demo";
import { storageDisponivel } from "../lib/storage";
import { codigoValido, retirarParametro } from "./reativacao";

/** Fora das chaves da sessão: reativar a amostra não tira a prévia. */
const CHAVE_PREVIA = "intermedi_previa";

function calcularLancamento(): number | null {
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const segundos = Number(new URLSearchParams(window.location.search).get("lancamento-em"));
    if (Number.isFinite(segundos) && segundos > 0) return Date.now() + segundos * 1000;
  }
  if (!LANCAMENTO) return null;
  const ms = Date.parse(LANCAMENTO);
  return Number.isFinite(ms) ? ms : null;
}

/** Instante do lançamento em milissegundos (null: sem contagem). */
export const LANCAMENTO_MS = calcularLancamento();

function previaLiberada(): boolean {
  if (!storageDisponivel()) return false;
  try {
    return window.localStorage.getItem(CHAVE_PREVIA) === "1";
  } catch {
    return false;
  }
}

/** Roda uma vez, antes do primeiro desenho: guarda a prévia se o código confere. */
export function liberarPreviaPeloEndereco(): void {
  if (typeof window === "undefined") return;
  const codigo = retirarParametro("previa");
  if (codigo === null || !codigoValido(codigo) || !storageDisponivel()) return;
  try {
    window.localStorage.setItem(CHAVE_PREVIA, "1");
  } catch {
    /* sem armazenamento a prévia não fica guardada */
  }
}

/** true quando o app já pode abrir: sem data, data passada ou prévia da equipe. */
export function appLiberado(agora = Date.now()): boolean {
  return LANCAMENTO_MS === null || agora >= LANCAMENTO_MS || previaLiberada();
}
