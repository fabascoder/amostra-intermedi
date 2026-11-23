// Sininho do topo (NotificacoesGerente, em components/ChamadosGerente.jsx do
// intermedi-frontend): pedidos de outras farmácias e o rastreamento das
// entregas. Os eventos vêm do mesmo cálculo do original (eventosRastreio).
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ManagerIcon } from "../../../shared/icons";
import { ListaRastreio } from "./Rastreio";
import { eventosRastreio } from "../lib/rastreio";
import { tempoDesde } from "../lib/chamados";
import { enderecosParaRastreio } from "../../../demoServices/pharmacyService";
import { marcarLidos } from "../../../demoServices/orderService";

const ENDERECOS = enderecosParaRastreio();

export default function Notificacoes({ experiencia, basePath, visao }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const painelId = useId();
  const navigate = useNavigate();
  const [novos, setNovos] = useState(() => new Set());
  const pedidos = experiencia === "solicitante" ? visao.enviados : visao.recebidos;
  const eventos = useMemo(() => eventosRastreio(pedidos.filter((p) => p.aoVivo || visao.agora - p.dataSolicitacao < 86400000), ENDERECOS, visao.agora), [pedidos, visao.agora]);
  const pendentes = visao.recebidos.filter((p) => p.status === "solicitada");
  const naoLidos = eventos.filter((e) => e.quando > visao.lidoAte).length;
  const total = pendentes.length + naoLidos;

  function alternar() {
    if (!aberto) {
      setNovos(new Set(eventos.filter((e) => e.quando > visao.lidoAte).map((e) => e.chave)));
      if (eventos[0]) marcarLidos(experiencia, eventos[0].quando);
    }
    setAberto((v) => !v);
  }

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (event) => { if (!ref.current?.contains(event.target)) setAberto(false); };
    const esc = (event) => {
      if (event.key === "Escape") {
        setAberto(false);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const linkPedido = (e) => `${basePath}/pedidos?${experiencia === "solicitante" ? "aba=enviados&" : ""}pedido=${e.pedido.idRedistribuicao}`;

  return (
    <div className="chamado-bell" ref={ref}>
      <button
        type="button"
        className="mgr-notifications"
        aria-expanded={aberto}
        aria-controls={painelId}
        aria-label={`Notificações: ${pendentes.length} ${pendentes.length === 1 ? "pedido da rede" : "pedidos da rede"} e ${naoLidos} ${naoLidos === 1 ? "atualização de entrega" : "atualizações de entrega"}`}
        onClick={alternar}
      >
        <ManagerIcon name="bell" size={17} />
        <b>{total}</b>
      </button>
      {aberto && (
        <div className="chamado-bell-panel" id={painelId} role="region" aria-label="Notificações">
          <p className="chamado-bell-title">Pedidos de outras farmácias</p>
          {pendentes.length ? (
            <ul>
              {pendentes.slice(0, 5).map((p) => (
                <li key={p.idRedistribuicao}>
                  <Link to={`${basePath}/pedidos?pedido=${p.idRedistribuicao}`} onClick={() => setAberto(false)}>
                    {p.mensagem}
                    <small>{tempoDesde(p.dataSolicitacao, visao.agora)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="chamado-bell-empty">Nenhum pedido aguardando você.</p>
          )}
          <Link className="chamado-bell-all" to={`${basePath}/pedidos`} onClick={() => setAberto(false)}>
            Ver pedidos da rede →
          </Link>
          <p className="chamado-bell-title chamado-bell-secao">Rastreamento das entregas</p>
          <ListaRastreio
            eventos={eventos}
            isNovo={(e) => novos.has(e.chave)}
            linkPara={linkPedido}
            onAbrir={(e) => { setAberto(false); navigate(linkPedido(e)); }}
          />
        </div>
      )}
    </div>
  );
}
