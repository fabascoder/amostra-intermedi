// Reativação pela equipe: abrir a amostra com ?reativar=CODIGO no endereço
// apaga a sessão deste navegador (encerrada ou ainda ativa) e começa de novo,
// com boas-vindas, nome e três horas novas. Nada aparece na tela.
//
// O código fica guardado só como hash, para não aparecer escrito no bundle.
// Sem backend, isso é uma barreira de interface, não uma senha de verdade:
// quem estudar o código ou apagar o armazenamento do navegador também reinicia.
import { reativarSessao } from "./session";

const PARAMETRO = "reativar";
const HASH_DO_CODIGO = "215lwfscpad";

/** Hash de 53 bits (cyrb53). Basta para comparar o código sem guardá-lo em texto. */
export function hashCodigo(texto: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Teclado do celular costuma pôr maiúscula e espaço: o código é comparado sem eles. */
export const codigoValido = (codigo: string) => hashCodigo(codigo.trim().toLowerCase()) === HASH_DO_CODIGO;

/** Tira o parâmetro do endereço (na busca ou depois do #, na prévia). Devolve o código, se havia. */
export function retirarParametro(nome: string = PARAMETRO): string | null {
  const url = new URL(window.location.href);
  let codigo = url.searchParams.get(nome);
  if (codigo !== null) url.searchParams.delete(nome);
  const [rota, busca] = url.hash.split("?");
  if (busca !== undefined) {
    const params = new URLSearchParams(busca);
    if (params.has(nome)) {
      codigo ??= params.get(nome);
      params.delete(nome);
      url.hash = params.size ? `${rota}?${params}` : rota;
    }
  }
  if (codigo === null) return null;
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  return codigo;
}

/** Roda uma vez, antes do primeiro desenho. Devolve true se reiniciou a amostra. */
export function reativarPeloEndereco(): boolean {
  if (typeof window === "undefined") return false;
  const codigo = retirarParametro();
  if (codigo === null || !codigoValido(codigo)) return false;
  reativarSessao();
  return true;
}
