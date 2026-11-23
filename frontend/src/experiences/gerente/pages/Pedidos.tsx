// Pedidos da rede (pages/ManagerNetworkOrders.jsx do intermedi-frontend).
// Recebidos: a farmácia é a fornecedora. Enviados: a farmácia pediu.
// As respostas e o preparo acontecem no navegador (orderService), com os
// mesmos textos, confirmações e rastreamento do sistema original.
import { useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  concluirPedidoAgora,
  concluirSolicitacaoAgora,
  receberNovaSolicitacao,
  responderSolicitacao,
} from "../../../demoServices/orderService";
import { notificar } from "../../../demoServices/notificationService";
import { previsaoPreparo } from "../../../simulators/pedidos";
import type { Pedido } from "../../../types";
import { RastreioEntrega, RastreioMini } from "../components/Rastreio";
import { FotoRemedio, StatusPedidoBadge, TarjaBadge } from "../components/Remedios";
import { useGerente } from "../contexto";
import { STATUS_PEDIDO, formatarDataChamado, tempoDesde } from "../lib/chamados";
import { emAndamento } from "../lib/rastreio";
import { PreparosEquipe } from "./PreparosEquipe";

const ABAS: [string, string, string][] = [
  ["recebidos", "Recebidos", "Outras farmácias pedindo remédios para a sua"],
  ["enviados", "Enviados", "O que a sua farmácia pediu à rede"],
];

function BotaoConcluir({ onConcluir }: { onConcluir: () => void }) {
  return (
    <button type="button" className="demo-concluir" onClick={onConcluir}>
      Concluir simulação agora
    </button>
  );
}

export default function Pedidos() {
  const { config, visao, pedirARede } = useGerente();
  const solicitante = config.id === "solicitante";
  const [params, setParams] = useSearchParams();
  const padrao = solicitante ? "enviados" : "recebidos";
  const aba = params.get("aba") === "enviados" || params.get("aba") === "recebidos" ? params.get("aba")! : padrao;
  const destaque = params.get("pedido");
  const [status, setStatus] = useState("");
  const todos = aba === "recebidos" ? visao.recebidos : visao.enviados;
  const pedidos = status ? todos.filter((p) => p.status === status) : todos;
  const pendentes = visao.recebidos.filter((p) => p.status === "solicitada").length;
  // pedidos feitos nesta demonstração: os em andamento e, depois da entrega, o mais recente
  const aoVivoEmCurso = visao.enviados.filter((p) => p.aoVivo).filter((p, i) => emAndamento(p) || i === 0);
  const ultimaRecebida = visao.recebidos.find((p) => p.aoVivo);
  const podeReceberOutra = !solicitante && ultimaRecebida && ["recebida", "recusada"].includes(ultimaRecebida.status);

  // Vindo do sino ou da visão geral (?pedido=ID): rola até o cartão
  useEffect(() => {
    if (!destaque) return;
    const quadro = requestAnimationFrame(() => document.getElementById(`pedido-${destaque}`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
    return () => cancelAnimationFrame(quadro);
  }, [destaque, aba]);

  function trocarAba(valor: string) {
    setStatus("");
    setParams(valor === padrao ? {} : { aba: valor });
  }

  return (
    <>
      <header className="mgr-page-head">
        <div>
          <h1>Pedidos da rede</h1>
          <p>Farmácias da rede pedem remédios umas às outras. {solicitante ? "Peça o que falta e acompanhe a entrega." : "Aceite para enviar do seu estoque."}</p>
        </div>
        {solicitante && (
          <button type="button" className="mgr-primary" onClick={() => pedirARede()}>+ Pedir à rede</button>
        )}
      </header>

      {aba === "enviados" && aoVivoEmCurso.map((p) => (
        <div key={p.idRedistribuicao} id={`pedido-${p.idRedistribuicao}`} className="demo-rastreio-vivo">
          <RastreioEntrega pedido={p} perspectiva="solicitante" />
          {emAndamento(p) && <BotaoConcluir onConcluir={() => concluirPedidoAgora(p.idRedistribuicao)} />}
        </div>
      ))}

      <section className="mgr-panel">
        <div className="mgr-toolbar">
          <div className="mgr-tabs" role="tablist" aria-label="Tipo de pedido">
            {ABAS.map(([valor, label]) => (
              <button key={valor} type="button" role="tab" aria-selected={aba === valor} aria-pressed={aba === valor} onClick={() => trocarAba(valor)}>
                {label}
                {valor === "recebidos" && pendentes > 0 && ` (${pendentes})`}
              </button>
            ))}
          </div>
          <select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_PEDIDO).map(([valor, { label }]) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </div>
        <p className="chamado-pedidos-descricao">{ABAS.find(([v]) => v === aba)![2]}.</p>

        {!pedidos.length ? (
          <p className="mgr-empty">
            {status ? "Nenhum pedido com este status." : aba === "recebidos" ? "Nenhuma farmácia pediu remédios para a sua." : "Sua farmácia ainda não pediu remédios à rede."}
          </p>
        ) : aba === "recebidos" ? (
          <ul className="chamado-pedidos">
            {pedidos.map((p) => (
              <li key={p.idRedistribuicao} id={`pedido-${p.idRedistribuicao}`}>
                <PedidoRecebido pedido={p} destacado={String(p.idRedistribuicao) === destaque} />
              </li>
            ))}
          </ul>
        ) : (
          <PedidosEnviados pedidos={pedidos} destaque={destaque} />
        )}
        {podeReceberOutra && (
          <div className="demo-painel-acao">
            <p>Quer atender outra farmácia? Uma nova solicitação chega em poucos segundos.</p>
            <button type="button" className="mgr-secondary" onClick={receberNovaSolicitacao}>Receber outra solicitação</button>
          </div>
        )}
        <p className="mgr-table-note">
          {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"} · Atualiza automaticamente
        </p>
      </section>
    </>
  );
}

function PedidoRecebido({ pedido: p, destacado }: { pedido: Pedido; destacado: boolean }) {
  const uid = useId();
  const [modo, setModo] = useState<"aceitar" | "recusar" | null>(null);
  const [motivo, setMotivo] = useState("");
  const depois = Number(p.estoqueOrigem) - Number(p.quantidade);
  const abaixo = depois < Number(p.estoqueMinimoOrigem);
  const previsao = previsaoPreparo(p.quantidade);
  const emCurso = p.aoVivo && ["aprovada", "preparando", "enviada"].includes(p.status);
  const comRastreio = p.aoVivo && (emCurso || p.status === "recebida");

  function enviar() {
    const aceitar = modo === "aceitar";
    if (!responderSolicitacao(p.idRedistribuicao, aceitar, motivo)) return;
    setModo(null);
    notificar(
      aceitar
        ? `${p.quantidade}× ${p.nomeRemedio} saiu do seu estoque. Sua equipe recebeu o aviso para preparar o envio à ${p.nomeFarmaciaDestino}.`
        : `Pedido recusado. A ${p.nomeFarmaciaDestino} foi avisada e o pedido segue para outra farmácia da rede.`,
    );
  }

  return (
    <article className={`chamado-pedido${destacado ? " chamado-pedido-destaque" : ""}${p.aoVivo ? " demo-pedido-vivo" : ""}`}>
      <div className="chamado-pedido-topo">
        <FotoRemedio nome={p.nomeRemedio} tamanho="md" />
        <div>
          <p className="chamado-pedido-msg" id={`${uid}-msg`}>{p.mensagem}</p>
          <div className="remedio-selos">
            <TarjaBadge valor={p.tarjaRemedio} />
            <span aria-live="polite"><StatusPedidoBadge status={p.status} /></span>
          </div>
          <small>Pedido #{p.idRedistribuicao} · {tempoDesde(p.dataSolicitacao)}</small>
        </div>
      </div>

      {p.status === "solicitada" && (
        <p className="chamado-pedido-impacto">
          Seu estoque: {p.estoqueOrigem} → <strong>{depois}</strong> após enviar (mínimo {p.estoqueMinimoOrigem})
          {abaixo && <span className="chamado-pedido-abaixo"> · vai ficar abaixo do mínimo</span>}
          <br />
          Preparo: {previsao.caixas} {previsao.caixas === 1 ? "caixa" : "caixas"} de {previsao.unidadesPorCaixa} un. · cerca de {previsao.segundos} s para carregar o caminhão
        </p>
      )}
      {p.status === "aprovada" && (
        <p className="chamado-pedido-impacto">Aceito por você · aguardando alguém da equipe começar o preparo</p>
      )}
      {(p.status === "preparando" || p.status === "enviada") && (
        <p className="chamado-pedido-impacto">
          {p.nomeFuncionarioPreparo ? `Preparado por ${p.nomeFuncionarioPreparo}` : "Enviado por você"}
          <RastreioMini pedido={p} perspectiva="fornecedor" />
        </p>
      )}
      {p.status === "recebida" && <p className="chamado-pedido-impacto">Entregue em {formatarDataChamado(p.dataRecebimento)}</p>}
      {p.status === "recusada" && (
        <p className="chamado-pedido-impacto">
          Recusado{p.nomeGerenteResposta ? ` por ${p.nomeGerenteResposta}` : ""}
          {p.motivoRecusa ? ` — Motivo: ${p.motivoRecusa}` : ""}
        </p>
      )}

      {p.aoVivo && <PreparosEquipe idPedido={p.idRedistribuicao} />}
      {comRastreio && (
        <div className="demo-pedido-rastreio">
          <RastreioEntrega pedido={p} perspectiva="fornecedor" minimalista />
          {emCurso && <BotaoConcluir onConcluir={() => concluirSolicitacaoAgora(p.idRedistribuicao)} />}
        </div>
      )}

      {p.status === "solicitada" && !modo && (
        <div className="mgr-modal-actions">
          <button type="button" className="mgr-primary" onClick={() => setModo("aceitar")} data-track="aceitar-pedido-rede">Aceitar pedido</button>
          <button type="button" className="mgr-delete-button chamado-recusar" onClick={() => setModo("recusar")}>Recusar</button>
        </div>
      )}

      {modo && (
        <div className="chamado-confirmar" role="group" aria-label="Confirmar resposta">
          {modo === "recusar" && (
            <label className="chamado-pedido-motivo" htmlFor={`${uid}-motivo`}>
              Motivo (opcional)
              <textarea id={`${uid}-motivo`} rows={2} maxLength={500} value={motivo} placeholder="Ex.: reservado para campanha" onChange={(e) => setMotivo(e.target.value)} />
            </label>
          )}
          <p>
            {modo === "aceitar"
              ? `Aceitar o pedido de ${p.quantidade}× ${p.nomeRemedio} da ${p.nomeFarmaciaDestino}? Sai do seu estoque agora e sua equipe recebe o aviso para preparar o envio.`
              : `Recusar o pedido de ${p.nomeFarmaciaDestino}? Ele será repassado para outra farmácia, se houver.`}
          </p>
          <div className="mgr-modal-actions">
            <button type="button" className="mgr-secondary" onClick={() => setModo(null)}>Voltar</button>
            <button type="button" className={modo === "aceitar" ? "mgr-primary" : "mgr-delete-button chamado-recusar"} onClick={enviar} autoFocus>
              {modo === "aceitar" ? "Confirmar aceite" : "Confirmar recusa"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function PedidosEnviados({ pedidos, destaque }: { pedidos: Pedido[]; destaque: string | null }) {
  return (
    <div className="mgr-table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Remédio</th>
            <th scope="col">Farmácia fornecedora</th>
            <th scope="col">Status</th>
            <th scope="col">Entrega</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.idRedistribuicao} className={String(p.idRedistribuicao) === destaque ? "demo-linha-destaque" : undefined}>
              <td>
                <strong>{p.quantidade}× {p.nomeRemedio}</strong>
                <small>{p.dosagemRemedio} · pedido #{p.idRedistribuicao}</small>
              </td>
              <td>{p.nomeFarmaciaOrigem}</td>
              <td>
                <span aria-live="polite"><StatusPedidoBadge status={p.status} /></span>
                {p.status === "recusada" && p.motivoRecusa && <small>Motivo: {p.motivoRecusa}</small>}
              </td>
              <td>
                {["solicitada", "aprovada", "preparando", "enviada"].includes(p.status) ? (
                  <RastreioMini pedido={p} />
                ) : p.status === "recebida" ? (
                  formatarDataChamado(p.dataRecebimento)
                ) : (
                  `pedido ${tempoDesde(p.dataSolicitacao)}`
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
