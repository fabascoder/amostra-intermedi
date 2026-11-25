// Sessão demonstrativa compartilhada pelas três experiências.
//
// - Criada uma única vez, quando o visitante aceita o aviso inicial e começa
//   a primeira experiência. Trocar de experiência, recarregar ou fechar o
//   navegador não a recria nem reinicia o cronômetro.
// - A validade é sempre comparada com Date.now() e o timestamp absoluto
//   expiresAt: ao iniciar, ao navegar, a cada 15 s, ao voltar para a aba e
//   antes das operações demonstrativas. Nada depende de um setTimeout de 3 h.
// - Ao expirar, o progresso e os dados demonstrativos são apagados; fica só a
//   marca de sessão encerrada, para a tela de fim de acesso.
//
// LIMITAÇÃO (documentada no README): sem backend, este bloqueio é só da
// interface. Quem apagar o armazenamento do navegador consegue uma sessão nova.
import { STORAGE_KEYS, sessionDurationMs } from "../config/demo";
import { gravar, lerBruto, ler, remover } from "../lib/storage";
import { createStore } from "../lib/store";
import type { ExperienciaId, Progresso, Sessao } from "../types";

export type EstadoSessao = { sessao: Sessao | null };

const PROGRESSO_INICIAL: Progresso = {
  visitadas: {},
  onboardingSolicitanteConcluido: false,
  onboardingFornecedoraConcluido: false,
  simulacoesConcluidas: {},
  conviteAvaliacaoDispensado: false,
  agradecimentoVisto: false,
  bastidoresVisto: false,
  guiasConcluidos: {},
  convites: { proximoEm: null, vistos: [] },
};

const ehSessao = (valor: unknown): valor is Sessao => {
  const s = valor as Sessao;
  return Boolean(s) && typeof s.sessionId === "string" && typeof s.createdAt === "number"
    && typeof s.expiresAt === "number" && (s.status === "active" || s.status === "expired")
    && s.expiresAt > s.createdAt;
};
const ehProgresso = (valor: unknown): valor is Progresso => {
  const p = valor as Progresso;
  return Boolean(p) && typeof p.visitadas === "object" && p.visitadas !== null && typeof p.simulacoesConcluidas === "object";
};

function lerSessao(): Sessao | null {
  const envelope = lerBruto<Sessao>(STORAGE_KEYS.session);
  if (!envelope || !ehSessao(envelope.data)) return null;
  return envelope.data;
}

function novoId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const sessaoStore = createStore<EstadoSessao>({ sessao: lerSessao() });
export const progressoStore = createStore<Progresso>(carregarProgresso(sessaoStore.get().sessao));

function carregarProgresso(sessao: Sessao | null): Progresso {
  if (!sessao || sessao.status !== "active") return PROGRESSO_INICIAL;
  return { ...PROGRESSO_INICIAL, ...ler(STORAGE_KEYS.progress, sessao.sessionId, PROGRESSO_INICIAL, ehProgresso) };
}

// Outros módulos (pedidos, aplicativo, avaliações) registram aqui como zerar
// o próprio estado em memória quando a sessão termina ou muda.
const aoTrocarSessao = new Set<() => void>();
export function registrarLimpeza(fn: () => void): () => void {
  aoTrocarSessao.add(fn);
  return () => aoTrocarSessao.delete(fn);
}

export const idSessaoAtual = (): string | null => {
  const s = sessaoStore.get().sessao;
  return s && s.status === "active" ? s.sessionId : null;
};

export type Situacao = "nenhuma" | "ativa" | "expirada";
export function situacao(sessao: Sessao | null = sessaoStore.get().sessao): Situacao {
  if (!sessao) return "nenhuma";
  return sessao.status === "active" ? "ativa" : "expirada";
}

/** Cria a sessão (se ainda não existir). Nunca reinicia uma sessão ativa ou expirada. */
export function iniciarSessao(): Sessao {
  verificarSessao();
  const atual = sessaoStore.get().sessao;
  if (atual) return atual;
  const agora = Date.now();
  const sessao: Sessao = { sessionId: novoId(), createdAt: agora, expiresAt: agora + sessionDurationMs(), status: "active" };
  gravar(STORAGE_KEYS.session, null, sessao);
  sessaoStore.set({ sessao });
  progressoStore.set(PROGRESSO_INICIAL);
  gravar(STORAGE_KEYS.progress, sessao.sessionId, PROGRESSO_INICIAL);
  aoTrocarSessao.forEach((fn) => fn());
  return sessao;
}

/** Confere a validade agora. Devolve true se a sessão está ativa. */
export function verificarSessao(): boolean {
  const sessao = sessaoStore.get().sessao;
  if (!sessao || sessao.status !== "active") return false;
  if (Date.now() >= sessao.expiresAt) {
    encerrarSessao();
    return false;
  }
  return true;
}

/** Fim do acesso: interrompe simulações e descarta todos os dados temporários. */
export function encerrarSessao(): void {
  const sessao = sessaoStore.get().sessao;
  if (!sessao) return;
  // o nome sobrevive ao fim, só para a mensagem de pedido de novo acesso
  const paciente = lerBruto<{ nome?: unknown }>(STORAGE_KEYS.patient);
  const nome = paciente?.sid === sessao.sessionId && typeof paciente.data?.nome === "string" ? paciente.data.nome : "";
  const encerrada: Sessao = { ...sessao, status: "expired", ...(nome && { nome }) };
  remover(STORAGE_KEYS.progress, STORAGE_KEYS.orders, STORAGE_KEYS.feedback, STORAGE_KEYS.patient);
  gravar(STORAGE_KEYS.session, null, encerrada);
  sessaoStore.set({ sessao: encerrada });
  progressoStore.set(PROGRESSO_INICIAL);
  aoTrocarSessao.forEach((fn) => fn());
}

/** Reativação pela equipe: apaga tudo deste navegador e volta ao começo (boas-vindas). */
export function reativarSessao(): void {
  remover(...Object.values(STORAGE_KEYS));
  sessaoStore.set({ sessao: null });
  progressoStore.set(PROGRESSO_INICIAL);
  aoTrocarSessao.forEach((fn) => fn());
}

function atualizarProgresso(mudar: (p: Progresso) => Progresso): void {
  const sid = idSessaoAtual();
  if (!sid || !verificarSessao()) return;
  const novo = mudar(progressoStore.get());
  progressoStore.set(novo);
  gravar(STORAGE_KEYS.progress, sid, novo);
}

export function marcarVisita(experiencia: ExperienciaId): void {
  if (progressoStore.get().visitadas[experiencia]) return;
  atualizarProgresso((p) => ({ ...p, visitadas: { ...p.visitadas, [experiencia]: Date.now() } }));
}

export function concluirOnboarding(experiencia: "solicitante" | "fornecedora"): void {
  atualizarProgresso((p) =>
    experiencia === "solicitante" ? { ...p, onboardingSolicitanteConcluido: true } : { ...p, onboardingFornecedoraConcluido: true },
  );
}

export function marcarSimulacaoConcluida(experiencia: "solicitante" | "fornecedora"): void {
  if (progressoStore.get().simulacoesConcluidas[experiencia]) return;
  atualizarProgresso((p) => ({ ...p, simulacoesConcluidas: { ...p.simulacoesConcluidas, [experiencia]: Date.now() } }));
}

export function marcarAgradecimentoVisto(): void {
  if (progressoStore.get().agradecimentoVisto) return;
  atualizarProgresso((p) => ({ ...p, agradecimentoVisto: true }));
}

/** Abriu os Bastidores: a Central passa a mostrar "Conheça a Auvox". */
export function marcarBastidoresVisto(): void {
  if (progressoStore.get().bastidoresVisto) return;
  atualizarProgresso((p) => ({ ...p, bastidoresVisto: true }));
}

/** Abriu o site da Auvox: o convite "Conheça a Auvox" não precisa mais aparecer. */
export function marcarAuvoxVisitado(): void {
  if (progressoStore.get().auvoxVisitado) return;
  atualizarProgresso((p) => ({ ...p, auvoxVisitado: true }));
}

/** Dica de etapa da Central fechada ou seguida: não volta a aparecer. */
export function marcarDicaVista(id: string): void {
  const vistas = progressoStore.get().dicasVistas ?? [];
  if (vistas.includes(id)) return;
  atualizarProgresso((p) => ({ ...p, dicasVistas: [...(p.dicasVistas ?? []), id] }));
}

export function concluirGuia(experiencia: "solicitante" | "fornecedora"): void {
  if (progressoStore.get().guiasConcluidos?.[experiencia]) return;
  atualizarProgresso((p) => ({ ...p, guiasConcluidos: { ...p.guiasConcluidos, [experiencia]: true } }));
}

/** Marca o convite como visto e agenda o próximo para daqui a `intervalo`. */
export function agendarConvite(visto: string | null, intervalo: number): void {
  atualizarProgresso((p) => {
    const atual = p.convites ?? { proximoEm: null, vistos: [] };
    const vistos = visto && !atual.vistos.includes(visto) ? [...atual.vistos, visto] : atual.vistos;
    return { ...p, convites: { proximoEm: Date.now() + intervalo, vistos } };
  });
}

export function dispensarConviteAvaliacao(): void {
  atualizarProgresso((p) => ({ ...p, conviteAvaliacaoDispensado: true }));
}

// Outra aba da mesma origem mudou a sessão (criou, encerrou): acompanha.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (evento) => {
    if (evento.key !== STORAGE_KEYS.session && evento.key !== null) return;
    const sessao = lerSessao();
    const anterior = sessaoStore.get().sessao;
    sessaoStore.set({ sessao });
    if (sessao?.sessionId !== anterior?.sessionId || sessao?.status !== anterior?.status) {
      progressoStore.set(carregarProgresso(sessao));
      aoTrocarSessao.forEach((fn) => fn());
    }
  });
}
