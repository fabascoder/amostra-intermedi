// Avaliações do visitante. Com o Google Forms configurado (src/config/avaliacao.ts)
// vão para a planilha da equipe; sem ele, ficam só no navegador. Para trocar de
// serviço, implemente FeedbackProvider e troque `provedor` — os componentes não mudam.
import { ENTRADAS, formsConfigurado, urlRespostaForms } from "../config/avaliacao";
import { STORAGE_KEYS } from "../config/demo";
import { pacienteStore } from "./patientService";
import { gravar, ler } from "../lib/storage";
import { createStore, useStore } from "../lib/store";
import { idSessaoAtual, registrarLimpeza, verificarSessao } from "../session/session";
import type { AlvoAvaliacao, Avaliacao } from "../types";

export const ALVOS: { valor: AlvoAvaliacao; rotulo: string }[] = [
  { valor: "geral", rotulo: "Experiência geral" },
  { valor: "paciente", rotulo: "Aplicativo do paciente" },
  { valor: "solicitante", rotulo: "Farmácia solicitante" },
  { valor: "fornecedora", rotulo: "Farmácia fornecedora" },
];

export const LIMITE_COMENTARIO = 600;

export interface FeedbackProvider {
  /** Registra a avaliação. Deve rejeitar com uma mensagem legível em caso de falha. */
  registrar(avaliacao: Avaliacao): Promise<void>;
  /** Se o envio é real (muda o texto de confirmação). */
  readonly enviaParaEquipe: boolean;
}

const ehLista = (v: unknown): v is Avaliacao[] => Array.isArray(v);

const avaliacoesStore = createStore<Avaliacao[]>(ler(STORAGE_KEYS.feedback, idSessaoAtual(), [], ehLista));
registrarLimpeza(() => avaliacoesStore.set(ler(STORAGE_KEYS.feedback, idSessaoAtual(), [], ehLista)));

const provedorLocal: FeedbackProvider = {
  enviaParaEquipe: false,
  async registrar(avaliacao) {
    const sid = idSessaoAtual();
    if (!sid || !verificarSessao()) throw new Error("Sua sessão demonstrativa terminou.");
    const lista = [...avaliacoesStore.get().filter((a) => a.alvo !== avaliacao.alvo), avaliacao];
    avaliacoesStore.set(lista);
    // Mesmo se o navegador bloquear o armazenamento, a avaliação vale nesta visita.
    gravar(STORAGE_KEYS.feedback, sid, lista);
  },
};

// Envia para o Google Forms da equipe (src/config/avaliacao.ts) e guarda a cópia
// local, que marca o item como avaliado nesta sessão. O Google não libera CORS,
// então o envio é "no-cors": só dá para saber se a rede falhou, não a resposta.
const provedorForms: FeedbackProvider = {
  enviaParaEquipe: true,
  async registrar(avaliacao) {
    const sid = idSessaoAtual();
    if (!sid || !verificarSessao()) throw new Error("Sua sessão demonstrativa terminou.");
    const corpo = new URLSearchParams({
      [ENTRADAS.nota]: String(avaliacao.nota),
      [ENTRADAS.alvo]: ALVOS.find((a) => a.valor === avaliacao.alvo)?.rotulo ?? avaliacao.alvo,
      [ENTRADAS.comentario]: avaliacao.comentario,
    });
    // quem respondeu: o primeiro nome informado no início da demonstração
    const nome = pacienteStore.get().nome;
    if (ENTRADAS.nome && nome) corpo.set(ENTRADAS.nome, nome);
    try {
      await fetch(urlRespostaForms(), {
        method: "POST",
        mode: "no-cors",
        body: corpo,
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new Error("Não foi possível enviar a avaliação. Confira a internet e tente de novo.");
    }
    await provedorLocal.registrar(avaliacao);
  },
};

export const provedor: FeedbackProvider = formsConfigurado() ? provedorForms : provedorLocal;

export type ErrosAvaliacao = Partial<Record<"nota" | "alvo" | "comentario", string>>;

export function validarAvaliacao(dados: { nota: number; alvo: string; comentario: string }): ErrosAvaliacao {
  const erros: ErrosAvaliacao = {};
  if (!Number.isInteger(dados.nota) || dados.nota < 1 || dados.nota > 5) erros.nota = "Escolha de 1 a 5 estrelas.";
  if (!ALVOS.some((a) => a.valor === dados.alvo)) erros.alvo = "Escolha o que deseja avaliar.";
  if (dados.comentario.length > LIMITE_COMENTARIO) erros.comentario = `Use no máximo ${LIMITE_COMENTARIO} caracteres.`;
  return erros;
}

let enviando = false;

/** Registra uma avaliação; uma por item avaliado na sessão (registrar de novo substitui). */
export async function registrarAvaliacao(dados: { nota: number; alvo: AlvoAvaliacao; comentario: string }): Promise<Avaliacao> {
  if (enviando) throw new Error("Aguarde: a avaliação anterior ainda está sendo registrada.");
  const erros = validarAvaliacao(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  enviando = true;
  try {
    const avaliacao: Avaliacao = {
      id: `${dados.alvo}-${Date.now().toString(36)}`,
      nota: dados.nota as Avaliacao["nota"],
      alvo: dados.alvo,
      comentario: dados.comentario.trim(),
      criadaEm: Date.now(),
    };
    await provedor.registrar(avaliacao);
    return avaliacao;
  } finally {
    enviando = false;
  }
}

export const useAvaliacoes = () => useStore(avaliacoesStore, (l) => l);
