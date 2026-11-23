// Visão geral do gerente (ManagerDashboard em pages/Manager.jsx do
// intermedi-frontend): cabeçalho, entregas em andamento, ferramentas,
// indicadores, avisos e a lista do que precisa do gerente.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { estoqueDaFarmacia, resumoEstoque } from "../../../demoServices/medicationService";
import { useProgresso } from "../../../session/hooks";
import { ConviteAvaliacao } from "../../../shared/Avaliacao";
import { ManagerIcon } from "../../../shared/icons";
import { DirectoryStats, Ferramentas } from "../components/Painel";
import { FaixaEmAndamento, RastreioMini } from "../components/Rastreio";
import { FotoRemedio, StatusPedidoBadge } from "../components/Remedios";
import { useGerente } from "../contexto";
import { tempoDesde } from "../lib/chamados";
import { emAndamento } from "../lib/rastreio";
import { primeiroNome, propsLinha } from "../lib/util";
import { PreparosEquipe } from "./PreparosEquipe";

export default function Dashboard() {
  const { config, visao, pedirARede } = useGerente();
  const navigate = useNavigate();
  const solicitante = config.id === "solicitante";
  const pedidos = solicitante ? visao.enviados : visao.recebidos;
  const linhas = useMemo(() => estoqueDaFarmacia(config.idFarmacia, visao.ajustes), [config.idFarmacia, visao.ajustes]);
  const resumo = resumoEstoque(linhas);
  const atencao = resumo.criticos + resumo.zerados + resumo.vencidos;
  const emCurso = pedidos.filter((p) => emAndamento(p) && !(p.perspectiva === "fornecedor" && p.status === "solicitada"));
  const pendentes = visao.recebidos.filter((p) => p.status === "solicitada");
  const concluida = useProgresso((p) => p.simulacoesConcluidas[config.id]);
  const [hoje] = useState(() => new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
  const abrirPedido = (id: number) => navigate(`${config.basePath}/pedidos?${solicitante ? "aba=enviados&" : ""}pedido=${id}`);

  const ferramentas = solicitante
    ? [
      { onClick: () => pedirARede(), icone: "truck", titulo: "Pedir à rede", descricao: "Um remédio de outra farmácia" },
      { to: `${config.basePath}/pedidos?aba=enviados`, icone: "clipboard", titulo: "Pedidos da rede", descricao: "Acompanhe o que você pediu", contador: emCurso.length },
      { to: `${config.basePath}/remedios`, icone: "pill", titulo: "Consultar estoque", descricao: "Remédios da unidade e da rede" },
      { to: `${config.basePath}/operacao`, icone: "cube", titulo: "Operação 3D", descricao: "A farmácia em uma visão espacial" },
    ]
    : [
      { to: `${config.basePath}/pedidos`, icone: "truck", titulo: "Pedidos da rede", descricao: "Outras farmácias pedindo a você", contador: pendentes.length },
      { to: `${config.basePath}/remedios`, icone: "pill", titulo: "Consultar estoque", descricao: "Remédios da unidade e da rede" },
      { to: `${config.basePath}/funcionarios`, icone: "people", titulo: "Sua equipe", descricao: "Quem prepara os envios" },
      { to: `${config.basePath}/operacao`, icone: "cube", titulo: "Operação 3D", descricao: "A farmácia em uma visão espacial" },
    ];

  return (
    <>
      <header className="mgr-page-head">
        <div>
          <h1>Visão geral</h1>
          <p>{`${config.unidade} · ${primeiroNome(config.gerente, "Gerente")} · ${hoje}`}</p>
        </div>
      </header>

      <FaixaEmAndamento pedidos={emCurso} onAbrirPedido={(p: { idRedistribuicao: number }) => abrirPedido(p.idRedistribuicao)} />

      {concluida && (
        <ConviteAvaliacao
          alvo={config.id}
          texto={solicitante ? "Você acompanhou um pedido da solicitação até a entrega." : "Você atendeu uma farmácia da rede do aceite até a entrega."}
        />
      )}

      {!solicitante && <PreparosEquipe />}

      <Ferramentas itens={ferramentas} />

      <DirectoryStats
        items={[
          ["Pedidos em andamento", emCurso.length, "truck", solicitante ? "pedidos seus a caminho" : "envios saindo da unidade", `${config.basePath}/pedidos${solicitante ? "?aba=enviados" : ""}`],
          ["Pedidos da rede", pendentes.length, "clipboard", "de outras farmácias para você", `${config.basePath}/pedidos`],
          ["Itens com atenção", atencao, "alert", "críticos, zerados ou vencidos", `${config.basePath}/remedios`],
          ["Itens no estoque", resumo.totalItens, "pill", "remédios cadastrados na unidade", `${config.basePath}/remedios`],
        ]}
      />

      {pendentes.length > 0 && (
        <div className="mgr-insight chamado-insight-rede">
          <span className="mgr-insight-icon">
            <ManagerIcon name="truck" />
          </span>
          <div>
            <strong>
              {pendentes.length === 1 ? "1 farmácia está pedindo um remédio do seu estoque" : `${pendentes.length} pedidos de outras farmácias aguardam sua resposta`}
            </strong>
            <p>Aceite ou recuse para a farmácia saber se pode contar com você.</p>
          </div>
          <Link to={`${config.basePath}/pedidos`}>Responder pedidos</Link>
        </div>
      )}
      {atencao > 0 && (
        <div className="mgr-insight">
          <span className="mgr-insight-icon">
            <ManagerIcon name="alert" />
          </span>
          <div>
            <strong>
              {atencao} {atencao === 1 ? "item do estoque precisa" : "itens do estoque precisam"} de atenção
            </strong>
            <p>{solicitante ? "Peça à rede os itens críticos ou zerados antes que acabem." : "Itens críticos, zerados ou vencidos aparecem primeiro na tabela."}</p>
          </div>
          <Link to={`${config.basePath}/remedios`}>Ver estoque</Link>
        </div>
      )}

      <section className="mgr-panel">
        <div className="mgr-panel-head">
          <div>
            <h2>{solicitante ? "Seus pedidos à rede" : "Pedidos que chegaram à unidade"}</h2>
            <p>{solicitante ? "Remédios que a sua farmácia pediu a outras farmácias." : "Farmácias da rede pedindo remédios do seu estoque."}</p>
          </div>
          <Link to={`${config.basePath}/pedidos${solicitante ? "?aba=enviados" : ""}`}>Ver todos →</Link>
        </div>
        {pedidos.length ? (
          pedidos.slice(0, 5).map((p) => (
            <div key={p.idRedistribuicao} {...propsLinha(() => abrirPedido(p.idRedistribuicao), `Abrir pedido #${p.idRedistribuicao}`)} className="mgr-ticket-line perfil-linha">
              <FotoRemedio nome={p.nomeRemedio} />
              <div>
                <strong>{p.quantidade}× {p.nomeRemedio} {p.dosagemRemedio}</strong>
                <small>
                  {solicitante ? `Pedido à ${p.nomeFarmaciaOrigem}` : `Para a ${p.nomeFarmaciaDestino}`} · pedido #{p.idRedistribuicao} · {tempoDesde(p.dataSolicitacao, visao.agora)}
                </small>
                {p.aoVivo && emAndamento(p) && <RastreioMini pedido={p} perspectiva={p.perspectiva} />}
              </div>
              <StatusPedidoBadge status={p.status} />
            </div>
          ))
        ) : (
          <p className="mgr-empty">{solicitante ? "Sua farmácia ainda não pediu remédios à rede." : "Nenhuma farmácia pediu remédios para a sua."}</p>
        )}
        {solicitante && (
          <div className="demo-painel-acao">
            <button type="button" className="mgr-primary" onClick={() => pedirARede()}>Pedir um remédio à rede</button>
          </div>
        )}
      </section>
    </>
  );
}
