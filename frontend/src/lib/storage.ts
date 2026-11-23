// Persistência local segura.
//
// Cada chave guarda um envelope { v, sid, data }:
//   v   — versão do formato (STORAGE_VERSION); outra versão é descartada;
//   sid — sessão demonstrativa dona do dado; dado de outra sessão é ignorado;
//   data — só o estado que muda (os catálogos estáticos vêm dos arquivos locais).
// JSON corrompido, cota cheia ou storage bloqueado (modo privado) nunca quebram
// a aplicação: a leitura devolve o valor padrão e a escrita falha em silêncio,
// mantendo o estado em memória.
import { STORAGE_VERSION } from "../config/demo";

type Envelope<T> = { v: number; sid: string | null; data: T };

let disponivel: boolean | null = null;
export function storageDisponivel(): boolean {
  if (disponivel !== null) return disponivel;
  try {
    const chave = "__intermedi_demo_teste__";
    window.localStorage.setItem(chave, "1");
    window.localStorage.removeItem(chave);
    disponivel = true;
  } catch {
    disponivel = false;
  }
  return disponivel;
}

/** Lê o envelope bruto sem validar a sessão (usado pela própria sessão). */
export function lerBruto<T>(chave: string): Envelope<T> | null {
  if (!storageDisponivel()) return null;
  try {
    const texto = window.localStorage.getItem(chave);
    if (!texto) return null;
    const valor = JSON.parse(texto) as Envelope<T>;
    if (!valor || typeof valor !== "object" || valor.v !== STORAGE_VERSION || !("data" in valor)) {
      window.localStorage.removeItem(chave);
      return null;
    }
    return valor;
  } catch {
    // JSON inválido: descarta para não falhar de novo na próxima leitura
    try {
      window.localStorage.removeItem(chave);
    } catch {
      /* nada a fazer */
    }
    return null;
  }
}

/** Lê o dado de `chave` se pertencer à sessão `sid`; senão devolve `padrao`. */
export function ler<T>(chave: string, sid: string | null, padrao: T, validar?: (dado: unknown) => dado is T): T {
  const envelope = lerBruto<T>(chave);
  if (!envelope || envelope.sid !== sid) return padrao;
  if (validar && !validar(envelope.data)) return padrao;
  return envelope.data;
}

// Escritas idênticas à última não tocam no disco (evita gravações repetidas).
const ultimaEscrita = new Map<string, string>();

export function gravar<T>(chave: string, sid: string | null, data: T): boolean {
  if (!storageDisponivel()) return false;
  try {
    const texto = JSON.stringify({ v: STORAGE_VERSION, sid, data } satisfies Envelope<T>);
    if (ultimaEscrita.get(chave) === texto) return true;
    window.localStorage.setItem(chave, texto);
    ultimaEscrita.set(chave, texto);
    return true;
  } catch {
    return false;
  }
}

export function remover(...chaves: string[]): void {
  chaves.forEach((chave) => {
    ultimaEscrita.delete(chave);
    if (!storageDisponivel()) return;
    try {
      window.localStorage.removeItem(chave);
    } catch {
      /* nada a fazer */
    }
  });
}
