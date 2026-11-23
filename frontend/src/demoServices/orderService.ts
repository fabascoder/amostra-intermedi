// Serviço demonstrativo de pedidos entre farmácias (redistribuição).
//
// Guarda só o mínimo (ids, quantidades, timestamps e o que já foi avisado) em
// intermedi_demo_orders; o pedido completo é calculado por src/simulators.
// Nada sai do navegador: cada visitante tem os próprios pedidos e nenhuma
// ação dele afeta outra pessoa.
import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../config/demo";
import { FORNECEDORA_TIMELINE } from "../config/simulation";
import { ESTOQUE, ID_FORNECEDORA, ID_SOLICITANTE, farmaciaPorId } from "../data/farmacias";
import { remedioPorId } from "../data/remedios";
import { gravar, ler } from "../lib/storage";
import { createStore, useStore } from "../lib/store";
import { idSessaoAtual, marcarSimulacaoConcluida, registrarLimpeza, verificarSessao } from "../session/session";
import {
  MODELOS_SOLICITACAO,
  etapaRecebida,
  etapaSolicitado,
  materializarRecebida,
  materializarSolicitado,
  pedidosHistoricos,
  proximaMudancaRecebida,
  proximaMudancaSolicitado,
  type PedidoSolicitado,
  type SolicitacaoRecebida,
} from "../simulators/pedidos";
import type { Pedido } from "../types";
import type { AjustesEstoque } from "./medicationService";
import { disponibilidade, podeEnviar } from "./medicationService";
import { notificar } from "./notificationService";

type EstadoPedidos = {
  solicitante: PedidoSolicitado[];
  fornecedora: SolicitacaoRecebida[];
  proximoId: number;
  lidoAte: { solicitante: number; fornecedora: number };
};

const INICIAL: EstadoPedidos = { solicitante: [], fornecedora: [], proximoId: 1050, lidoAte: { solicitante: 0, fornecedora: 0 } };
const MAX_ATIVOS = 3;

const ehEstado = (v: unknown): v is EstadoPedidos => {
  const e = v as EstadoPedidos;
  return Boolean(e) && Array.isArray(e.solicitante) && Array.isArray(e.fornecedora) && typeof e.proximoId === "number";
};

const carregar = (): EstadoPedidos => ({ ...INICIAL, ...ler(STORAGE_KEYS.orders, idSessaoAtual(), INICIAL, ehEstado) });

export const pedidosStore = createStore<EstadoPedidos>(carregar());
registrarLimpeza(() => pedidosStore.set(carregar()));

function salvar(mudar: (e: EstadoPedidos) => EstadoPedidos): boolean {
  const sid = idSessaoAtual();
  if (!sid || !verificarSessao()) return false;
  const novo = mudar(pedidosStore.get());
  pedidosStore.set(novo);
  gravar(STORAGE_KEYS.orders, sid, novo);
  return true;
}

const estoqueBase = (idFarmacia: number, idRemedio: number) => ESTOQUE.find((e) => e.idFarmacia === idFarmacia && e.idRemedio === idRemedio);

// ---------------------------------------------------------------------
//  Leitura
// ---------------------------------------------------------------------

/** Entradas e saídas de estoque causadas pelos pedidos desta sessão. */
export function ajustesEstoque(estado: EstadoPedidos, agora: number): AjustesEstoque {
  const ajustes: AjustesEstoque = new Map();
  const somar = (idFarmacia: number, idRemedio: number, delta: number) => {
    const chave = `${idFarmacia}:${idRemedio}`;
    ajustes.set(chave, (ajustes.get(chave) ?? 0) + delta);
  };
  estado.solicitante.forEach((o) => {
    const etapa = etapaSolicitado(o, agora);
    if (etapa >= 1) somar(o.idFornecedora, o.idRemedio, -o.quantidade);
    if (etapa >= 4) somar(ID_SOLICITANTE, o.idRemedio, o.quantidade);
  });
  estado.fornecedora.forEach((s) => {
    const etapa = etapaRecebida(s, agora);
    const modelo = MODELOS_SOLICITACAO[s.modelo % MODELOS_SOLICITACAO.length];
    if (etapa >= 1 && etapa <= 4) somar(ID_FORNECEDORA, modelo.idRemedio, -modelo.quantidade);
    if (etapa === 4) somar(modelo.idSolicitante, modelo.idRemedio, modelo.quantidade);
  });
  return ajustes;
}

function proximaMudanca(estado: EstadoPedidos, agora: number): number | null {
  const tempos = [
    ...estado.solicitante.map((o) => proximaMudancaSolicitado(o, agora)),
    ...estado.fornecedora.map((s) => proximaMudancaRecebida(s, agora)),
  ].filter((t): t is number => t !== null);
  return tempos.length ? Math.min(...tempos) : null;
}

/**
 * Instante atual que só avança quando algum pedido muda de etapa: um único
 * timeout para o próximo marco, em vez de relógios em cada componente.
 */
export function useAgoraDosPedidos(): number {
  const estado = useStore(pedidosStore, (e) => e);
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    setAgora(Date.now());
  }, [estado]);
  useEffect(() => {
    const proximo = proximaMudanca(estado, agora);
    if (proximo === null) return undefined;
    const timer = window.setTimeout(() => setAgora(Date.now()), Math.max(0, proximo - Date.now()) + 40);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") setAgora(Date.now());
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [estado, agora]);
  return agora;
}

export type VisaoPedidos = {
  agora: number;
  enviados: Pedido[]; // o que a farmácia pediu (perspectiva solicitante)
  recebidos: Pedido[]; // o que pediram à farmácia (perspectiva fornecedor)
  ajustes: AjustesEstoque;
  lidoAte: number;
};

/** Pedidos de cada experiência de gerente, já com o estágio atual. */
export function usePedidos(experiencia: "solicitante" | "fornecedora"): VisaoPedidos {
  const estado = useStore(pedidosStore, (e) => e);
  const agora = useAgoraDosPedidos();
  return useMemo(() => {
    const ajustes = ajustesEstoque(estado, agora);
    const historico = pedidosHistoricos();
    const qtd = (idFarmacia: number, idRemedio: number) => {
      const base = estoqueBase(idFarmacia, idRemedio);
      return { qtd: Math.max(0, (base?.quantidade ?? 0) + (ajustes.get(`${idFarmacia}:${idRemedio}`) ?? 0)), min: base?.estoqueMinimo ?? 0 };
    };
    const ordenar = (lista: Pedido[]) => [...lista].sort((a, b) => b.dataSolicitacao - a.dataSolicitacao);
    if (experiencia === "solicitante") {
      const vivos = estado.solicitante.map((o) => materializarSolicitado(o, agora));
      return { agora, ajustes, enviados: ordenar([...vivos, ...historico.solicitante]), recebidos: [], lidoAte: estado.lidoAte.solicitante };
    }
    const vivos = estado.fornecedora
      .map((s) => {
        const modelo = MODELOS_SOLICITACAO[s.modelo % MODELOS_SOLICITACAO.length];
        // antes do aceite, o impacto é calculado sobre o estoque atual da fornecedora
        const { qtd: estoque, min } = qtd(ID_FORNECEDORA, modelo.idRemedio);
        const aceito = s.resposta === "aceita";
        return materializarRecebida(s, agora, aceito ? estoque + modelo.quantidade : estoque, min);
      })
      .filter((p): p is Pedido => p !== null);
    return { agora, ajustes, enviados: [], recebidos: ordenar([...vivos, ...historico.fornecedor]), lidoAte: estado.lidoAte.fornecedora };
  }, [estado, agora, experiencia]);
}

export const useEstadoPedidos = () => useStore(pedidosStore, (e) => e);

// ---------------------------------------------------------------------
//  Ações da farmácia solicitante
// ---------------------------------------------------------------------

export type ResultadoPedido = { ok: true; id: number } | { ok: false; erro: string };

export function criarPedido({ idRemedio, quantidade, idFornecedora }: { idRemedio: number; quantidade: number; idFornecedora: number }): ResultadoPedido {
  if (!verificarSessao()) return { ok: false, erro: "Sua sessão demonstrativa terminou." };
  const estado = pedidosStore.get();
  const agora = Date.now();
  const ativos = estado.solicitante.filter((o) => etapaSolicitado(o, agora) < 4).length;
  if (ativos >= MAX_ATIVOS) return { ok: false, erro: `Acompanhe os ${MAX_ATIVOS} pedidos em andamento antes de fazer outro.` };
  if (!remedioPorId.has(idRemedio)) return { ok: false, erro: "Selecione o remédio." };
  if (!Number.isInteger(quantidade) || quantidade <= 0) return { ok: false, erro: "Informe um número inteiro maior que zero." };
  const oferta = disponibilidade(idRemedio, ajustesEstoque(estado, agora), ID_SOLICITANTE).find((d) => d.farmacia.idFarmacia === idFornecedora);
  if (!oferta || !farmaciaPorId.has(idFornecedora)) return { ok: false, erro: "Escolha uma farmácia da rede com esse remédio em estoque." };
  const limite = podeEnviar(oferta);
  if (quantidade > limite) return { ok: false, erro: `A ${oferta.farmacia.nomeFarmacia} pode enviar até ${limite} unidades sem ficar abaixo do mínimo.` };
  const id = estado.proximoId;
  const salvo = salvar((e) => ({
    ...e,
    proximoId: e.proximoId + 1,
    solicitante: [...e.solicitante, { id, idRemedio, quantidade, idFornecedora, startedAt: agora, avisado: 0 }],
  }));
  return salvo ? { ok: true, id } : { ok: false, erro: "Não foi possível registrar o pedido nesta demonstração." };
}

export function concluirPedidoAgora(id: number): void {
  salvar((e) => ({ ...e, solicitante: e.solicitante.map((o) => (o.id === id && o.forcedAt === undefined ? { ...o, forcedAt: Date.now() } : o)) }));
}

// ---------------------------------------------------------------------
//  Ações da farmácia fornecedora
// ---------------------------------------------------------------------

/** Agenda a solicitação demonstrativa (chega ~3 s depois). Não duplica. */
export function agendarSolicitacao(): void {
  const estado = pedidosStore.get();
  if (estado.fornecedora.length) return;
  salvar((e) => ({
    ...e,
    proximoId: e.proximoId + 1,
    fornecedora: [{ id: e.proximoId, modelo: 0, chegaEm: Date.now() + FORNECEDORA_TIMELINE.chegadaSolicitacao, avisada: false, avisado: 0 }],
  }));
}

/** Depois de recusar ou entregar, o visitante pode receber outra solicitação. */
export function receberNovaSolicitacao(): void {
  const estado = pedidosStore.get();
  const agora = Date.now();
  if (estado.fornecedora.some((s) => {
    const etapa = etapaRecebida(s, agora);
    return etapa >= -1 && etapa < 4;
  })) return;
  const ultimo = estado.fornecedora.at(-1);
  salvar((e) => ({
    ...e,
    proximoId: e.proximoId + 1,
    fornecedora: [...e.fornecedora, { id: e.proximoId, modelo: (ultimo?.modelo ?? -1) + 1, chegaEm: agora + FORNECEDORA_TIMELINE.chegadaSolicitacao, avisada: false, avisado: 0 }],
  }));
}

export function responderSolicitacao(id: number, aceitar: boolean, motivo = ""): boolean {
  return salvar((e) => ({
    ...e,
    fornecedora: e.fornecedora.map((s) =>
      s.id === id && !s.resposta ? { ...s, resposta: aceitar ? "aceita" : "recusada", respondidaEm: Date.now(), motivo: motivo.trim().slice(0, 500) || undefined } : s,
    ),
  }));
}

export function comecarPreparo(id: number): void {
  const agora = Date.now();
  salvar((e) => ({
    ...e,
    fornecedora: e.fornecedora.map((s) => (s.id === id && s.resposta === "aceita" && etapaRecebida(s, agora) === 1 ? { ...s, preparoEm: agora } : s)),
  }));
}

export function concluirSolicitacaoAgora(id: number): void {
  salvar((e) => ({ ...e, fornecedora: e.fornecedora.map((s) => (s.id === id && s.resposta === "aceita" && s.forcedAt === undefined ? { ...s, forcedAt: Date.now() } : s)) }));
}

export function marcarLidos(experiencia: "solicitante" | "fornecedora", ate: number): void {
  if (pedidosStore.get().lidoAte[experiencia] >= ate) return;
  salvar((e) => ({ ...e, lidoAte: { ...e.lidoAte, [experiencia]: ate } }));
}

// ---------------------------------------------------------------------
//  Avisos na hora certa (uma vez por etapa)
// ---------------------------------------------------------------------

function textoSolicitante(etapa: number, p: Pedido): string {
  const item = `${p.quantidade}× ${p.nomeRemedio} ${p.dosagemRemedio}`;
  switch (etapa) {
    case 1: return `${p.nomeFarmaciaOrigem} aceitou a solicitação de ${item}.`;
    case 2: return `Medicamento em preparação na ${p.nomeFarmaciaOrigem}${p.nomeFuncionarioPreparo ? ` (${p.nomeFuncionarioPreparo})` : ""}.`;
    case 3: return `Medicamento em transporte: ${item} saiu da ${p.nomeFarmaciaOrigem}.`;
    case 4: return `Entrega concluída: ${item} chegou à ${p.nomeFarmaciaDestino} e entrou no estoque.`;
    default: return `Solicitação enviada à ${p.nomeFarmaciaOrigem}.`;
  }
}

function textoFornecedora(etapa: number, p: Pedido): string {
  switch (etapa) {
    case 2: return `${p.nomeFuncionarioPreparo ?? "Sua equipe"} começou o preparo: ${p.quantidade}× ${p.nomeRemedio}.`;
    case 3: return `Saiu para entrega: ${p.quantidade}× ${p.nomeRemedio} a caminho da ${p.nomeFarmaciaDestino}.`;
    case 4: return `Entregue: ${p.quantidade}× ${p.nomeRemedio} chegou à ${p.nomeFarmaciaDestino}.`;
    default: return "";
  }
}

/** Montado uma vez no layout de cada experiência de gerente. */
export function useAvisosPedidos(experiencia: "solicitante" | "fornecedora", ativo: boolean): void {
  const estado = useStore(pedidosStore, (e) => e);
  const agora = useAgoraDosPedidos();
  useEffect(() => {
    if (!ativo) return;
    if (experiencia === "solicitante") {
      estado.solicitante.forEach((o) => {
        const etapa = etapaSolicitado(o, agora);
        if (etapa <= o.avisado) return;
        notificar(textoSolicitante(etapa, materializarSolicitado(o, agora)), { tom: etapa === 4 ? "sucesso" : "padrao" });
        if (etapa === 4) marcarSimulacaoConcluida("solicitante");
        salvar((e) => ({ ...e, solicitante: e.solicitante.map((x) => (x.id === o.id ? { ...x, avisado: etapa } : x)) }));
      });
      return;
    }
    estado.fornecedora.forEach((s) => {
      const etapa = etapaRecebida(s, agora);
      if (etapa < 0) return;
      if (!s.avisada) {
        notificar("Nova solicitação de medicamento recebida.", { duracao: 9000 });
        salvar((e) => ({ ...e, fornecedora: e.fornecedora.map((x) => (x.id === s.id ? { ...x, avisada: true, avisado: Math.max(x.avisado, 1) } : x)) }));
        return;
      }
      if (etapa === 9 || etapa <= s.avisado) return;
      const pedido = materializarRecebida(s, agora, 0, 0);
      const texto = pedido ? textoFornecedora(etapa, pedido) : "";
      if (texto) notificar(texto, { tom: etapa === 4 ? "sucesso" : "padrao" });
      if (etapa === 4) marcarSimulacaoConcluida("fornecedora");
      salvar((e) => ({ ...e, fornecedora: e.fornecedora.map((x) => (x.id === s.id ? { ...x, avisado: etapa } : x)) }));
    });
  }, [estado, agora, experiencia, ativo]);
}
