// Relógio da contagem. A contagem é sempre a diferença entre "agora" e o
// lançamento, recalculada a cada segundo: recarregar a página não muda nada.
//
// Para a plateia e o projetor chegarem ao zero juntos, "agora" é acertado uma
// vez pelo cabeçalho Date do próprio servidor de arquivos (uma requisição HEAD
// leve, sem backend). Celulares já sincronizam a hora pela rede; o acerto só é
// aplicado quando o relógio do aparelho está claramente errado (mais de 1,5 s),
// porque o cabeçalho tem resolução de um segundo.

let desvio = 0;

export const agora = (): number => Date.now() + desvio;

let sincronizacao: Promise<void> | null = null;

export function sincronizarRelogio(): Promise<void> {
  sincronizacao ??= (async () => {
    try {
      const antes = Date.now();
      const resposta = await fetch(`/favicon.png?relogio=${antes}`, { method: "HEAD", cache: "no-store" });
      const depois = Date.now();
      const cabecalho = resposta.headers.get("date");
      if (!cabecalho || depois - antes > 3000) return; // rede lenta demais para confiar
      const servidor = Date.parse(cabecalho) + 500; // meio do segundo informado
      const diferenca = servidor - (antes + depois) / 2;
      if (Number.isFinite(diferenca) && Math.abs(diferenca) > 1500 && Math.abs(diferenca) < 7 * 86_400_000) desvio = diferenca;
    } catch {
      /* sem rede: vale o relógio do aparelho */
    }
  })();
  return sincronizacao;
}
