// Regras da simulação de pedidos (src/simulators/pedidos.ts): o estágio é
// sempre calculado por timestamps, inclusive depois de "Concluir simulação agora".
import { test } from "node:test";
import assert from "node:assert/strict";
import { SOLICITANTE_TIMELINE, FORNECEDORA_TIMELINE } from "../src/config/simulation.ts";
import {
  etapaRecebida,
  etapaSolicitado,
  materializarRecebida,
  materializarSolicitado,
  proximaMudancaSolicitado,
  type PedidoSolicitado,
  type SolicitacaoRecebida,
} from "../src/simulators/pedidos.ts";

const T0 = 1_800_000_000_000;
const pedido = (extra: Partial<PedidoSolicitado> = {}): PedidoSolicitado => ({ id: 1050, idRemedio: 2, quantidade: 32, idFornecedora: 2, startedAt: T0, avisado: 0, ...extra });

test("solicitante: etapas em 0, 5, 10, 15 e 20 segundos", () => {
  const o = pedido();
  assert.equal(etapaSolicitado(o, T0), 0);
  assert.equal(etapaSolicitado(o, T0 + SOLICITANTE_TIMELINE.aceite), 1);
  assert.equal(etapaSolicitado(o, T0 + SOLICITANTE_TIMELINE.preparo), 2);
  assert.equal(etapaSolicitado(o, T0 + SOLICITANTE_TIMELINE.envio), 3);
  assert.equal(etapaSolicitado(o, T0 + SOLICITANTE_TIMELINE.entrega), 4);
  assert.equal(etapaSolicitado(o, T0 + 3 * 3_600_000), 4, "voltar horas depois mostra entregue");
});

test("solicitante: status no formato do backend", () => {
  const o = pedido();
  const status = [0, 5_000, 10_000, 15_000, 20_000].map((ms) => materializarSolicitado(o, T0 + ms).status);
  assert.deepEqual(status, ["solicitada", "aprovada", "preparando", "enviada", "recebida"]);
  const entregue = materializarSolicitado(o, T0 + 20_000);
  assert.equal(entregue.dataRecebimento, T0 + 20_000);
  assert.equal(entregue.nomeFarmaciaOrigem, "Farmácia Jardim");
  assert.equal(entregue.nomeFarmaciaDestino, "Farmácia Central");
});

test("Concluir simulação agora: tudo o que faltava acontece no instante do clique", () => {
  const o = pedido({ forcedAt: T0 + 2_000 });
  const p = materializarSolicitado(o, T0 + 2_000);
  assert.equal(p.status, "recebida");
  assert.equal(p.dataAprovacao, T0 + 2_000);
  assert.equal(p.dataRecebimento, T0 + 2_000);
  assert.equal(proximaMudancaSolicitado(o, T0 + 2_000), null, "nenhum timer depois de concluir");
});

test("próxima mudança agenda um único timer para o próximo marco", () => {
  assert.equal(proximaMudancaSolicitado(pedido(), T0 + 1_000), T0 + 5_000);
  assert.equal(proximaMudancaSolicitado(pedido(), T0 + 12_000), T0 + 15_000);
});

const recebida = (extra: Partial<SolicitacaoRecebida> = {}): SolicitacaoRecebida => ({ id: 1052, modelo: 0, chegaEm: T0 + 3_000, avisada: false, avisado: 0, ...extra });

test("fornecedora: a solicitação só aparece depois de chegar", () => {
  assert.equal(etapaRecebida(recebida(), T0), -1);
  assert.equal(materializarRecebida(recebida(), T0, 420, 30), null);
  assert.equal(etapaRecebida(recebida(), T0 + 3_000), 0);
});

test("fornecedora: aceite, preparo por caixas, viagem e entrega", () => {
  const aceite = T0 + 10_000;
  const s = recebida({ resposta: "aceita", respondidaEm: aceite });
  const caixas = Math.ceil(120 / FORNECEDORA_TIMELINE.unidadesPorCaixa);
  const inicio = aceite + FORNECEDORA_TIMELINE.funcionarioAssume;
  const saida = inicio + caixas * FORNECEDORA_TIMELINE.porCaixa;
  const chegada = saida + FORNECEDORA_TIMELINE.viagem;
  assert.equal(etapaRecebida(s, aceite), 1);
  assert.equal(etapaRecebida(s, inicio), 2);
  assert.equal(etapaRecebida(s, saida), 3);
  assert.equal(etapaRecebida(s, chegada), 4);
  const p = materializarRecebida(s, inicio + 1, 420, 30)!;
  assert.equal(p.status, "preparando");
  assert.equal(p.caixas, caixas);
  assert.equal(p.nomeFuncionarioPreparo, "Thiago Almeida");
});

test("fornecedora: começar o preparo antes adianta todo o resto", () => {
  const aceite = T0 + 10_000;
  const s = recebida({ resposta: "aceita", respondidaEm: aceite, preparoEm: aceite + 1_000 });
  assert.equal(etapaRecebida(s, aceite + 1_000), 2);
});

test("fornecedora: recusa guarda o motivo", () => {
  const s = recebida({ resposta: "recusada", respondidaEm: T0 + 5_000, motivo: "Reservado para campanha" });
  const p = materializarRecebida(s, T0 + 6_000, 420, 30)!;
  assert.equal(p.status, "recusada");
  assert.equal(p.motivoRecusa, "Reservado para campanha");
});
