// Simulação dos pedidos entre farmácias. Funções puras: recebem o que está
// salvo (pouca coisa: ids, quantidades e timestamps) e o instante atual, e
// devolvem o pedido completo no formato do intermedi-backend. O estágio é
// sempre derivado de startedAt + tempos de config/simulation.ts, por isso a
// simulação continua certa depois de recarregar ou trocar de experiência.
import { FORNECEDORA_TIMELINE, SOLICITANTE_TIMELINE } from "../config/simulation.ts";
import { EQUIPES, ID_FORNECEDORA, ID_SOLICITANTE, farmaciaPorId } from "../data/farmacias.ts";
import { remedioPorId } from "../data/remedios.ts";
import type { Pedido, StatusPedido } from "../types";

/** Pedido feito pelo visitante na experiência da farmácia solicitante. */
export type PedidoSolicitado = {
  id: number;
  idRemedio: number;
  quantidade: number;
  idFornecedora: number;
  startedAt: number;
  /** "Concluir simulação agora": etapas que faltavam acontecem neste instante. */
  forcedAt?: number;
  /** Última etapa já avisada (evita notificação repetida ao voltar). */
  avisado: number;
};

/** Solicitação que chega à farmácia fornecedora. */
export type SolicitacaoRecebida = {
  id: number;
  modelo: number;
  chegaEm: number;
  avisada: boolean;
  resposta?: "aceita" | "recusada";
  respondidaEm?: number;
  motivo?: string;
  /** Instante em que o funcionário começou o preparo (antes do automático). */
  preparoEm?: number;
  forcedAt?: number;
  avisado: number;
};

/** Solicitações que podem chegar à fornecedora (Farmácia Jardim). */
export const MODELOS_SOLICITACAO = [
  { idRemedio: 5, quantidade: 120, idSolicitante: 3 },
  { idRemedio: 6, quantidade: 150, idSolicitante: 4 },
  { idRemedio: 1, quantidade: 100, idSolicitante: 5 },
] as const;

export const ETAPAS_SOLICITANTE = ["Solicitação enviada", "Fornecedora aceitou", "Em preparação", "Em transporte", "Entrega concluída"] as const;

const caixasPara = (quantidade: number) => Math.max(1, Math.ceil(quantidade / FORNECEDORA_TIMELINE.unidadesPorCaixa));

function nomes(idFarmacia: number) {
  const equipe = EQUIPES[idFarmacia];
  return {
    gerente: equipe?.gerente ?? null,
    funcionario: equipe?.funcionarios[0]?.nome ?? null,
  };
}

function base(idRemedio: number, quantidade: number, origem: number, destino: number, id: number) {
  const r = remedioPorId.get(idRemedio)!;
  const fOrigem = farmaciaPorId.get(origem)!;
  const fDestino = farmaciaPorId.get(destino)!;
  return {
    idRedistribuicao: id,
    idRemedio,
    nomeRemedio: r.nomeRemedio,
    dosagemRemedio: r.dosagemRemedio,
    tarjaRemedio: r.tarjaRemedio,
    fotoRemedio: r.fotoRemedio,
    quantidade,
    idFarmaciaOrigem: origem,
    nomeFarmaciaOrigem: fOrigem.nomeFarmacia,
    idFarmaciaDestino: destino,
    nomeFarmaciaDestino: fDestino.nomeFarmacia,
    mensagem: `${fDestino.nomeFarmacia} pede ${quantidade}× ${r.nomeRemedio} ${r.dosagemRemedio}`,
    caixas: caixasPara(quantidade),
  };
}

const vazio = {
  dataAprovacao: null, dataInicioPreparo: null, dataEnvio: null, dataPrevistaChegada: null,
  dataRecebimento: null, dataRecusa: null, motivoRecusa: null, nomeGerenteResposta: null, nomeFuncionarioPreparo: null,
};

/** Etapa (0 a 4) do pedido solicitado em `agora`. */
export function etapaSolicitado(o: PedidoSolicitado, agora: number): number {
  const t = instantesSolicitado(o);
  return t.entrega <= agora ? 4 : t.envio <= agora ? 3 : t.preparo <= agora ? 2 : t.aceite <= agora ? 1 : 0;
}

function instantesSolicitado(o: PedidoSolicitado) {
  const em = (ms: number) => {
    const previsto = o.startedAt + ms;
    return o.forcedAt !== undefined && previsto > o.forcedAt ? o.forcedAt : previsto;
  };
  return {
    aceite: em(SOLICITANTE_TIMELINE.aceite),
    preparo: em(SOLICITANTE_TIMELINE.preparo),
    envio: em(SOLICITANTE_TIMELINE.envio),
    entrega: em(SOLICITANTE_TIMELINE.entrega),
  };
}

export function materializarSolicitado(o: PedidoSolicitado, agora: number, estoqueOrigem = 0, minimoOrigem = 0): Pedido {
  const t = instantesSolicitado(o);
  const etapa = etapaSolicitado(o, agora);
  const status: StatusPedido = (["solicitada", "aprovada", "preparando", "enviada", "recebida"] as const)[etapa];
  const pessoas = nomes(o.idFornecedora);
  return {
    ...base(o.idRemedio, o.quantidade, o.idFornecedora, ID_SOLICITANTE, o.id),
    ...vazio,
    status,
    dataSolicitacao: o.startedAt,
    dataAprovacao: etapa >= 1 ? t.aceite : null,
    dataInicioPreparo: etapa >= 2 ? t.preparo : null,
    dataEnvio: etapa >= 2 ? t.envio : null,
    dataPrevistaChegada: etapa >= 1 ? t.entrega : null,
    dataRecebimento: etapa >= 4 ? t.entrega : null,
    nomeGerenteResposta: etapa >= 1 ? pessoas.gerente : null,
    nomeFuncionarioPreparo: etapa >= 2 ? pessoas.funcionario : null,
    estoqueOrigem,
    estoqueMinimoOrigem: minimoOrigem,
    perspectiva: "solicitante",
    aoVivo: true,
  };
}

/** Próximo instante em que o pedido muda de etapa (ou null se acabou). */
export function proximaMudancaSolicitado(o: PedidoSolicitado, agora: number): number | null {
  const futuros = Object.values(instantesSolicitado(o)).filter((t) => t > agora);
  return futuros.length ? Math.min(...futuros) : null;
}

// ---------------------------------------------------------------------
//  Fornecedora
// ---------------------------------------------------------------------

function instantesRecebida(s: SolicitacaoRecebida) {
  const modelo = MODELOS_SOLICITACAO[s.modelo % MODELOS_SOLICITACAO.length];
  const respondida = s.respondidaEm ?? Number.POSITIVE_INFINITY;
  const caixas = caixasPara(modelo.quantidade);
  const clamp = (ms: number) => (s.forcedAt !== undefined && ms > s.forcedAt ? s.forcedAt : ms);
  const preparo = s.preparoEm ?? respondida + FORNECEDORA_TIMELINE.funcionarioAssume;
  const saida = preparo + caixas * FORNECEDORA_TIMELINE.porCaixa;
  const chegada = saida + FORNECEDORA_TIMELINE.viagem;
  return { modelo, preparo: clamp(preparo), saida: clamp(saida), chegada: clamp(chegada) };
}

/** Etapa da solicitação recebida: -1 ainda não chegou, 0 aguardando resposta, 1 aceita, 2 preparo, 3 a caminho, 4 entregue, 9 recusada. */
export function etapaRecebida(s: SolicitacaoRecebida, agora: number): number {
  if (agora < s.chegaEm) return -1;
  if (s.resposta === "recusada") return 9;
  if (s.resposta !== "aceita") return 0;
  const t = instantesRecebida(s);
  return t.chegada <= agora ? 4 : t.saida <= agora ? 3 : t.preparo <= agora ? 2 : 1;
}

export function materializarRecebida(s: SolicitacaoRecebida, agora: number, estoqueOrigem: number, minimoOrigem: number): Pedido | null {
  const etapa = etapaRecebida(s, agora);
  if (etapa < 0) return null;
  const t = instantesRecebida(s);
  const pessoas = nomes(ID_FORNECEDORA);
  const status: StatusPedido = etapa === 9 ? "recusada" : (["solicitada", "aprovada", "preparando", "enviada", "recebida"] as const)[etapa];
  return {
    ...base(t.modelo.idRemedio, t.modelo.quantidade, ID_FORNECEDORA, t.modelo.idSolicitante, s.id),
    ...vazio,
    status,
    dataSolicitacao: s.chegaEm,
    dataAprovacao: etapa >= 1 && etapa !== 9 ? s.respondidaEm ?? null : null,
    dataRecusa: etapa === 9 ? s.respondidaEm ?? null : null,
    motivoRecusa: etapa === 9 ? s.motivo || null : null,
    dataInicioPreparo: etapa >= 2 && etapa !== 9 ? t.preparo : null,
    dataEnvio: etapa >= 2 && etapa !== 9 ? t.saida : null,
    dataPrevistaChegada: etapa >= 1 && etapa !== 9 ? t.chegada : null,
    dataRecebimento: etapa === 4 ? t.chegada : null,
    nomeGerenteResposta: s.resposta ? "você" : null,
    nomeFuncionarioPreparo: etapa >= 2 && etapa !== 9 ? pessoas.funcionario : null,
    estoqueOrigem,
    estoqueMinimoOrigem: minimoOrigem,
    perspectiva: "fornecedor",
    aoVivo: true,
  };
}

export function proximaMudancaRecebida(s: SolicitacaoRecebida, agora: number): number | null {
  const candidatos = [s.chegaEm];
  if (s.resposta === "aceita") {
    const t = instantesRecebida(s);
    candidatos.push(t.preparo, t.saida, t.chegada);
  }
  const futuros = candidatos.filter((t) => t > agora);
  return futuros.length ? Math.min(...futuros) : null;
}

/** Previsão do preparo para mostrar antes do aceite ("3 caixas · cerca de 12 s"). */
export function previsaoPreparo(quantidade: number) {
  const caixas = caixasPara(quantidade);
  return { caixas, unidadesPorCaixa: FORNECEDORA_TIMELINE.unidadesPorCaixa, segundos: Math.round((caixas * FORNECEDORA_TIMELINE.porCaixa) / 1000) };
}

// ---------------------------------------------------------------------
//  Histórico fictício (pedidos antigos, já concluídos)
// ---------------------------------------------------------------------
const DIA = 86_400_000;
const HORA = 3_600_000;

function historico(id: number, idRemedio: number, quantidade: number, origem: number, destino: number, diasAtras: number, perspectiva: "solicitante" | "fornecedor", recusa?: string): Pedido {
  const agora = Date.now();
  const pedido = agora - diasAtras * DIA - 3 * HORA;
  const aceite = pedido + 25 * 60_000;
  const inicio = aceite + 40 * 60_000;
  const saida = inicio + 20 * 60_000;
  const chegada = saida + 2 * HORA;
  const origemPessoas = nomes(origem);
  return {
    ...base(idRemedio, quantidade, origem, destino, id),
    ...vazio,
    status: recusa ? "recusada" : "recebida",
    dataSolicitacao: pedido,
    ...(recusa
      ? { dataRecusa: aceite, motivoRecusa: recusa, nomeGerenteResposta: origemPessoas.gerente ?? "Gerente" }
      : {
        dataAprovacao: aceite, dataInicioPreparo: inicio, dataEnvio: saida, dataPrevistaChegada: chegada, dataRecebimento: chegada,
        nomeGerenteResposta: perspectiva === "fornecedor" ? "você" : origemPessoas.gerente ?? "Gerente",
        nomeFuncionarioPreparo: origemPessoas.funcionario ?? "Equipe da farmácia",
      }),
    estoqueOrigem: 0,
    estoqueMinimoOrigem: 0,
    perspectiva,
    aoVivo: false,
  };
}

let cacheHistorico: { solicitante: Pedido[]; fornecedor: Pedido[] } | null = null;
export function pedidosHistoricos() {
  cacheHistorico ??= {
    solicitante: [
      historico(1041, 2, 60, ID_FORNECEDORA, ID_SOLICITANTE, 2, "solicitante"),
      historico(1037, 7, 90, 3, ID_SOLICITANTE, 5, "solicitante"),
      historico(1032, 9, 20, 5, ID_SOLICITANTE, 6, "solicitante", "Reservado para a campanha de inverno da unidade"),
    ],
    fornecedor: [
      historico(1040, 6, 80, ID_FORNECEDORA, 4, 1, "fornecedor"),
      historico(1035, 1, 120, ID_FORNECEDORA, ID_SOLICITANTE, 4, "fornecedor"),
    ],
  };
  return cacheHistorico;
}
