// Em que fase do lançamento o visitante está: contagem, abertura ou plataforma.
// Este arquivo entra no pacote principal, então fica pequeno: o resto da camada
// de lançamento (contagem, abertura, som) só é baixado por quem precisa dela.
//
// Regras do público:
//   antes do lançamento ............ contagem (o app nunca aparece)
//   depois, sem ter visto a abertura  abertura e, em seguida, a plataforma
//   depois, já tendo visto ......... plataforma direto
// A marcação "já vi" fica no localStorage, fora das chaves da sessão
// demonstrativa: reativar a amostra não repete a abertura.
//
// Ensaio da equipe (não interfere no público): ?ensaio=CODIGO, com o mesmo
// código da reativação (em desenvolvimento, qualquer valor). Opções:
//   &fase=contagem&em=10  contagem de 10 s, zero, abertura e plataforma
//   &fase=abertura        só a abertura, toda vez que abrir, e a plataforma
//   &fase=depois          visitante depois do lançamento: abertura na primeira
//                         vez; ao recarregar, plataforma direto
//   &quadro=8.5           (com abertura) para a abertura nesse segundo
//   &perfil=leve          força o perfil de aparelhos modestos
// O ensaio vive só nesta aba (sessionStorage) e nunca grava a marcação real.
import { codigoValido } from "../session/reativacao";
import { LANCAMENTO } from "./config";

export type Fase = "contagem" | "abertura" | "demo";
export type FaseEnsaio = "contagem" | "abertura" | "depois";
export type Ensaio = {
  fase: FaseEnsaio;
  em: number;
  lancamentoMs: number;
  vista: boolean;
  quadro: number | null;
  perfil: "pleno" | "leve" | null;
};

const CHAVE_VISTA = "intermedi_abertura_vista";
const CHAVE_ENSAIO = "intermedi_ensaio";
const PARAMETROS = ["ensaio", "fase", "em", "quadro", "perfil"];

function armazenamento(tipo: "localStorage" | "sessionStorage"): Storage | null {
  try {
    return typeof window === "undefined" ? null : window[tipo];
  } catch {
    return null;
  }
}

function lerEnsaioGuardado(): Ensaio | null {
  try {
    const texto = armazenamento("sessionStorage")?.getItem(CHAVE_ENSAIO);
    if (!texto) return null;
    const e = JSON.parse(texto) as Ensaio;
    return e && ["contagem", "abertura", "depois"].includes(e.fase) && Number.isFinite(e.lancamentoMs) ? e : null;
  } catch {
    return null;
  }
}

function guardarEnsaio(e: Ensaio | null): void {
  try {
    const s = armazenamento("sessionStorage");
    if (e) s?.setItem(CHAVE_ENSAIO, JSON.stringify(e));
    else s?.removeItem(CHAVE_ENSAIO);
  } catch {
    /* sem armazenamento, o ensaio vale só até recarregar */
  }
}

function novoEnsaio(fase: FaseEnsaio, em: number, quadro: number | null, perfil: Ensaio["perfil"]): Ensaio {
  const agora = Date.now();
  const lancamentoMs = fase === "contagem" ? agora + em * 1000 : fase === "abertura" ? agora : agora - 86_400_000;
  return { fase, em, lancamentoMs, vista: false, quadro, perfil };
}

/** Lê ?ensaio=… do endereço (e o tira dali), ou retoma o ensaio desta aba. */
function iniciarEnsaio(): Ensaio | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("ensaio")) return lerEnsaioGuardado();
  const codigo = url.searchParams.get("ensaio") ?? "";
  const faseParam = url.searchParams.get("fase");
  const emParam = Number(url.searchParams.get("em"));
  const quadroParam = url.searchParams.get("quadro");
  const perfilParam = url.searchParams.get("perfil");
  for (const p of PARAMETROS) url.searchParams.delete(p);
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  if (!import.meta.env.DEV && !codigoValido(codigo)) return lerEnsaioGuardado();
  const fase: FaseEnsaio = faseParam === "abertura" || faseParam === "depois" ? faseParam : "contagem";
  const em = Number.isFinite(emParam) && emParam >= 3 ? Math.min(emParam, 3600) : 10;
  const quadro = quadroParam !== null && Number.isFinite(Number(quadroParam)) ? Math.max(0, Number(quadroParam)) : null;
  const perfil = perfilParam === "leve" || perfilParam === "pleno" ? perfilParam : null;
  const ensaio = novoEnsaio(fase, em, quadro, perfil);
  guardarEnsaio(ensaio);
  return ensaio;
}

let ensaio = iniciarEnsaio();

/** Ensaio ativo nesta aba, se houver. */
export const ensaioAtual = (): Ensaio | null => ensaio;

/** Instante do lançamento em ms (do ensaio, se houver), ou null sem lançamento. */
export function momentoLancamento(): number | null {
  if (ensaio) return ensaio.lancamentoMs;
  if (!LANCAMENTO) return null;
  const ms = Date.parse(LANCAMENTO);
  return Number.isFinite(ms) ? ms : null;
}

export function aberturaVista(): boolean {
  if (ensaio) return ensaio.fase !== "abertura" && ensaio.vista;
  try {
    return armazenamento("localStorage")?.getItem(CHAVE_VISTA) === "1";
  } catch {
    return false;
  }
}

export function marcarAberturaVista(): void {
  if (ensaio) {
    ensaio = { ...ensaio, vista: true };
    guardarEnsaio(ensaio);
    return;
  }
  try {
    armazenamento("localStorage")?.setItem(CHAVE_VISTA, "1");
  } catch {
    /* sem armazenamento, a abertura pode aparecer de novo; nada quebra */
  }
}

/** Fase em que o visitante chega, decidida antes do primeiro desenho. */
export function faseInicial(agora = Date.now()): Fase {
  const ms = momentoLancamento();
  if (ms === null) return "demo";
  if (agora < ms) return "contagem";
  return aberturaVista() ? "demo" : "abertura";
}

/** Recomeça o ensaio atual do início (nova contagem, abertura não vista). */
export function repetirEnsaio(): void {
  if (!ensaio) return;
  guardarEnsaio(novoEnsaio(ensaio.fase, ensaio.em, ensaio.quadro, ensaio.perfil));
  window.location.reload();
}

export function sairDoEnsaio(): void {
  guardarEnsaio(null);
  window.location.reload();
}
