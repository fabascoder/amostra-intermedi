import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/brand/logo-intermedi.webp";
import { useEstadoPedidos, useAgoraDosPedidos } from "../demoServices/orderService";
import { usePaciente } from "../demoServices/patientService";
import { useAvaliacoes } from "../demoServices/feedbackService";
import { iniciarSessao, verificarSessao } from "../session/session";
import { formatarRestante, useAgora, useExpiraEm, useProgresso, useSituacaoSessao } from "../session/hooks";
import { etapaRecebida, etapaSolicitado, ETAPAS_SOLICITANTE } from "../simulators/pedidos";
import { AvaliacaoDialogo } from "../shared/Avaliacao";
import { AvisoDemo } from "../shared/AvisoDemo";
import { ContadorSessao } from "../shared/Sessao";
import { ManagerIcon, PersonaIcon } from "../shared/icons";
import { MascoteAvatar } from "../shared/Mascote";
import type { ExperienciaId } from "../types";
import "./central.css";

const EXPERIENCIAS: { id: ExperienciaId; rota: string; titulo: string; onde: string; papel: string }[] = [
  {
    id: "solicitante",
    rota: "/solicitante",
    titulo: "Quero solicitar medicamentos",
    onde: "Farmácia Central · Guaianases",
    papel: "Gerente",
  },
  {
    id: "fornecedora",
    rota: "/fornecedora",
    titulo: "Quero atender solicitações",
    onde: "Farmácia Jardim · Jardim Soares",
    papel: "Gerente",
  },
  {
    id: "paciente",
    rota: "/aplicativo",
    titulo: "Quero conhecer o aplicativo",
    onde: "Aplicativo do paciente",
    papel: "Paciente",
  },
];

// Pré-carrega o código da experiência ao passar o mouse ou focar a opção.
const PRECARREGAR: Record<ExperienciaId, () => Promise<unknown>> = {
  solicitante: () => import("../experiences/gerente/GerenteExperiencia"),
  fornecedora: () => import("../experiences/gerente/GerenteExperiencia"),
  paciente: () => import("../experiences/paciente/PacienteApp"),
};

/** O que está acontecendo agora em cada experiência (a parte viva da Central). */
function useSituacaoExperiencias(): Record<ExperienciaId, string | null> {
  const pedidos = useEstadoPedidos();
  const agora = useAgoraDosPedidos();
  const nome = usePaciente((p) => p.nome);
  const ultimoPedido = pedidos.solicitante.at(-1);
  const ultimaSolicitacao = pedidos.fornecedora.at(-1);
  let solicitante: string | null = null;
  if (ultimoPedido) {
    const etapa = etapaSolicitado(ultimoPedido, agora);
    solicitante = etapa === 4 ? "Último pedido entregue" : `Pedido #${ultimoPedido.id}: ${ETAPAS_SOLICITANTE[etapa].toLowerCase()}`;
  }
  let fornecedora: string | null = null;
  if (ultimaSolicitacao) {
    const etapa = etapaRecebida(ultimaSolicitacao, agora);
    fornecedora = etapa < 0 ? "Uma solicitação está chegando"
      : etapa === 0 ? "Solicitação aguardando sua resposta"
        : etapa === 9 ? "Solicitação recusada"
          : etapa === 4 ? "Envio entregue à farmácia solicitante"
            : etapa === 3 ? "Envio a caminho"
              : "Envio em preparo pela equipe";
  }
  return { solicitante, fornecedora, paciente: nome ? `Entrando como ${nome}` : null };
}

function PainelSessao({ visitadas }: { visitadas: number }) {
  const expiraEm = useExpiraEm();
  const situacao = useSituacaoSessao();
  const agora = useAgora(situacao === "ativa");
  const restante = expiraEm ? expiraEm - agora : 0;
  return (
    <section className="central-sessao" aria-labelledby="central-sessao-titulo">
      <h2 id="central-sessao-titulo">Sua sessão</h2>
      {situacao === "ativa" && expiraEm ? (
        <>
          <p className="central-relogio" aria-hidden="true">{formatarRestante(restante)}</p>
          <p className="central-relogio-legenda">
            restantes de 3 horas · termina às {new Date(expiraEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="sr-only">Restam cerca de {Math.ceil(restante / 60000)} minutos de acesso.</p>
        </>
      ) : (
        <>
          <p className="central-relogio is-parado" aria-hidden="true">3:00:00</p>
          <p className="central-relogio-legenda">Começa na primeira experiência.</p>
        </>
      )}
      <div className="central-progresso">
        <p>
          <strong>{visitadas} de 3</strong> experiências visitadas
        </p>
        <span className="central-progresso-trilho" aria-hidden="true">
          {[0, 1, 2].map((i) => <i key={i} className={i < visitadas ? "is-feito" : undefined} />)}
        </span>
      </div>
    </section>
  );
}

export default function Central() {
  const navigate = useNavigate();
  const location = useLocation();
  const situacao = useSituacaoSessao();
  const visitadas = useProgresso((p) => p.visitadas);
  const totalVisitadas = EXPERIENCIAS.filter((e) => visitadas[e.id]).length;
  const avaliacoes = useAvaliacoes();
  const agoraDe = useSituacaoExperiencias();
  const pedido = (location.state as { pedir?: ExperienciaId } | null)?.pedir;
  const [destino, setDestino] = useState<ExperienciaId | null>(pedido ?? null);
  const [avaliando, setAvaliando] = useState(false);

  useEffect(() => {
    document.title = "Intermedi Demo";
    window.scrollTo({ top: 0 });
  }, []);

  function escolher(id: ExperienciaId) {
    const rota = EXPERIENCIAS.find((e) => e.id === id)!.rota;
    if (situacao === "ativa" && verificarSessao()) {
      navigate(rota);
      return;
    }
    setDestino(id);
  }

  function comecar() {
    if (!destino) return;
    iniciarSessao();
    const rota = EXPERIENCIAS.find((e) => e.id === destino)!.rota;
    setDestino(null);
    navigate(rota, { replace: false });
  }

  return (
    <div className="central">
      <header className="central-topo">
        <img className="central-logo" src={logo} alt="Intermedi" width="1920" height="1080" />
        <div className="central-topo-direita">
          <ContadorSessao />
          {situacao === "ativa" && (
            <button type="button" className="central-avaliar" onClick={() => setAvaliando(true)}>
              <ManagerIcon name="star" size={17} />
              Avaliar o Intermedi
            </button>
          )}
        </div>
      </header>

      <main className="central-corpo" id="conteudo">
        <div className="central-principal">
          <div className="central-titulo">
            <h1>Como deseja explorar o Intermedi?</h1>
            <p>
              Escolha uma experiência. Dá para alternar quando quiser.
            </p>
          </div>

          <ul className="central-opcoes" aria-label="Experiências">
            {EXPERIENCIAS.map((exp, indice) => {
              const visitada = Boolean(visitadas[exp.id]);
              const agora = agoraDe[exp.id];
              return (
                <li key={exp.id} style={{ "--i": indice } as React.CSSProperties}>
                  <button
                    type="button"
                    className={`central-opcao central-opcao-${exp.id}`}
                    onClick={() => escolher(exp.id)}
                    onPointerEnter={() => void PRECARREGAR[exp.id]().catch(() => {})}
                    onFocus={() => void PRECARREGAR[exp.id]().catch(() => {})}
                    data-track={`central:${exp.id}`}
                  >
                    <span className="central-opcao-figura" aria-hidden="true">
                      {exp.id === "paciente" ? <MascoteAvatar id="broto" tamanho={64} fundo="transparent" /> : <PersonaIcon role="gerente" size={44} />}
                    </span>
                    <span className="central-opcao-texto">
                      <span className="central-opcao-titulo">{exp.titulo}</span>
                      <span className="central-opcao-meta">
                        <span>{exp.papel} · {exp.onde}</span>
                        {visitada && (
                          <span className="central-selo is-visitada">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 12.5 4 4 8-9" /></svg>
                            Visitada
                          </span>
                        )}
                      </span>
                      {agora && <span className="central-opcao-agora" aria-live="polite">{agora}</span>}
                    </span>
                    <span className="central-opcao-ir" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="central-lateral">
          <PainelSessao visitadas={totalVisitadas} />

          <section className="central-sobre" aria-labelledby="central-sobre-titulo">
            <h2 id="central-sobre-titulo">Sobre esta demonstração</h2>
            <ul>
              <li>Todos os dados são fictícios.</li>
              <li>Tudo é simulado no seu aparelho.</li>
            </ul>
          </section>

          {situacao === "ativa" && (
            <section className="central-avaliacao" aria-labelledby="central-avaliacao-titulo">
              <h2 id="central-avaliacao-titulo">O que achou do Intermedi?</h2>
              <p>
                {avaliacoes.length
                  ? `Você registrou ${avaliacoes.length} ${avaliacoes.length === 1 ? "avaliação" : "avaliações"} nesta demonstração.`
                  : "Dê uma nota de 1 a 5."}
              </p>
              <button type="button" className="demo-botao" onClick={() => setAvaliando(true)}>
                {avaliacoes.length ? "Avaliar outro item" : "Avaliar o Intermedi"}
              </button>
            </section>
          )}
        </aside>
      </main>

      <footer className="central-rodape">
        <p>
          <strong>Intermedi</strong> Conectando farmácias. Aproximando o cuidado.
        </p>
        <p>Versão demonstrativa · Um produto Auvox</p>
      </footer>

      {destino && <AvisoDemo onComecar={comecar} onFechar={() => setDestino(null)} />}
      {avaliando && <AvaliacaoDialogo onFechar={() => setAvaliando(false)} />}
    </div>
  );
}
