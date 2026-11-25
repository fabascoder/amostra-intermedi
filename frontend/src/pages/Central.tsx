import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/brand/logo-intermedi.webp";
import { useEstadoPedidos, useAgoraDosPedidos } from "../demoServices/orderService";
import { usePaciente } from "../demoServices/patientService";
import { useAvaliacoes } from "../demoServices/feedbackService";
import { marcarAgradecimentoVisto, marcarDicaVista, verificarSessao } from "../session/session";
import { Agradecimento } from "../shared/Agradecimento";
import { formatarRestante, useAgora, useExpiraEm, useProgresso, useSituacaoSessao } from "../session/hooks";
import { etapaRecebida, etapaSolicitado, ETAPAS_SOLICITANTE } from "../simulators/pedidos";
import { AvaliacaoDialogo } from "../shared/Avaliacao";
import { ContadorSessao } from "../shared/Sessao";
import { ManagerIcon, PersonaIcon } from "../shared/icons";
import { MascoteAvatar } from "../shared/Mascote";
import type { ExperienciaId } from "../types";
import { BoasVindasDemo } from "./BoasVindasDemo";
import { VideoPlataforma } from "../shared/VideoPlataforma";
import { LOGO_AUVOX } from "../shared/AssinaturaAuvox";
import { AUVOX } from "../config/demo";
import { PESSOAS } from "../data/bastidores";
import { fotoDe } from "../data/fotos";
import "./central.css";

const EXPERIENCIAS: { id: ExperienciaId; rota: string; titulo: string }[] = [
  {
    id: "solicitante",
    rota: "/solicitante",
    titulo: "Quero solicitar medicamentos",
  },
  {
    id: "fornecedora",
    rota: "/fornecedora",
    titulo: "Quero atender solicitações",
  },
  {
    id: "paciente",
    rota: "/aplicativo",
    titulo: "Quero conhecer o aplicativo",
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

const QUINZE_MIN = 15 * 60 * 1000;

/**
 * Tempo da sessão no topo. A borda de baixo mostra as experiências visitadas;
 * ao tocar, abre para baixo dizendo até quando a amostra fica disponível.
 */
function SessaoTopo({ visitadas }: { visitadas: number }) {
  const expiraEm = useExpiraEm();
  const situacao = useSituacaoSessao();
  const agora = useAgora(situacao === "ativa");
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e: PointerEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  if (situacao !== "ativa" || !expiraEm) return <ContadorSessao />;
  const restante = Math.max(0, expiraEm - agora);
  const hora = new Date(expiraEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const minutos = Math.ceil(restante / 60000);
  return (
    <div ref={caixa} className={`central-tempo${aberto ? " is-aberto" : ""}${restante < QUINZE_MIN ? " is-pouco" : ""}`}>
      <button
        type="button"
        className="central-tempo-botao"
        aria-expanded={aberto}
        aria-controls="central-tempo-detalhe"
        aria-label={`Sessão: ${minutos} ${minutos === 1 ? "minuto restante" : "minutos restantes"}, ${visitadas} de 3 experiências visitadas. ${aberto ? "Fechar" : "Ver"} detalhes`}
        onClick={() => setAberto((a) => !a)}
      >
        <i className="central-tempo-ponto" aria-hidden="true" />
        <span className="central-tempo-modo" aria-hidden="true">Modo Demo ·</span>
        <b aria-hidden="true">{formatarRestante(restante)}</b>
        <span className="central-tempo-sufixo" aria-hidden="true">restantes</span>
        <svg className="central-tempo-seta" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="central-tempo-borda" aria-hidden="true">
          {[0, 1, 2].map((i) => <i key={i} className={i < visitadas ? "is-feito" : undefined} />)}
        </span>
      </button>
      <div id="central-tempo-detalhe" className="central-tempo-detalhe" inert={!aberto} aria-hidden={!aberto}>
        <p className="central-tempo-rotulo">Disponível até</p>
        <p className="central-tempo-hora">{hora}</p>
        <p className="central-tempo-legenda">{formatarRestante(restante)} restantes de 3 horas</p>
        <div className="central-tempo-progresso">
          <p><strong>{visitadas} de 3</strong> experiências visitadas</p>
          <span className="central-tempo-trilho" aria-hidden="true">
            {[0, 1, 2].map((i) => <i key={i} className={i < visitadas ? "is-feito" : undefined} />)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Os três aparelhos da rede: cada experiência da amostra é um deles. */
const APARELHOS: { id: string; aparelho: "computador" | "celular"; titulo: string; onde: string; texto: string }[] = [
  {
    id: "solicitante",
    aparelho: "computador",
    titulo: "Farmácia que pede",
    onde: "Computador da farmácia solicitante",
    texto: "O gerente vê que falta um remédio e pede para outras farmácias da rede.",
  },
  {
    id: "fornecedora",
    aparelho: "computador",
    titulo: "Farmácia que atende",
    onde: "Outro computador, em outra farmácia",
    texto: "O gerente recebe o pedido, aceita e a equipe prepara o envio.",
  },
  {
    id: "paciente",
    aparelho: "celular",
    titulo: "Aplicativo do paciente",
    onde: "Celular de qualquer pessoa",
    texto: "O público procura o remédio, vê em qual farmácia tem e cuida das doses.",
  },
];

function IconeAparelho({ tipo }: { tipo: "computador" | "celular" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tipo === "computador" ? (
        <>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M9 20h6M12 16v4" />
        </>
      ) : (
        <>
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M11 18.5h2" />
        </>
      )}
    </svg>
  );
}

/** Aviso de versão beta e, em "Ler mais", o que é esta amostra: três plataformas juntas. */
function SobreAmostra() {
  const [aberto, setAberto] = useState(false);
  return (
    <div className={`central-beta${aberto ? " is-aberto" : ""}`}>
      <div className="central-beta-linha">
        <VideoPlataforma compacto />
        <p>
          <strong>Amostra beta</strong> do Intermedi
        </p>
        <button type="button" className="central-beta-mais" aria-expanded={aberto} aria-controls="central-beta-detalhe" onClick={() => setAberto((a) => !a)}>
          {aberto ? "Ler menos" : "Ler mais"}
        </button>
      </div>
      {aberto && (
        <div id="central-beta-detalhe" className="central-beta-detalhe">
          <p>
            Aqui você vê só uma parte do Intermedi: a plataforma completa tem mais funcionalidades.
          </p>
          <p>
            Na vida real, o Intermedi são <strong>três plataformas diferentes</strong>, cada uma no seu aparelho:
          </p>
          <ol className="central-aparelhos">
            {APARELHOS.map((a, i) => (
              <li key={a.id} style={{ "--i": i } as React.CSSProperties}>
                <span className={`central-aparelho-icone is-${a.aparelho}`}>
                  <IconeAparelho tipo={a.aparelho} />
                </span>
                <span>
                  <strong>{a.titulo}</strong>
                  <small>{a.onde}</small>
                  {a.texto}
                </span>
              </li>
            ))}
          </ol>
          <p>
            Esta amostra é a <strong>exposição das três juntas</strong>, num lugar só, para você conhecer cada lado da rede
            sem precisar de três aparelhos.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Linhas pequenas para os Bastidores e a Auvox, sempre visíveis na Central.
 * Depois das três experiências, uma dica de etapa aponta para cada uma.
 * Os convites em janela continuam aparecendo de tempos em tempos.
 */
const SEM_DICAS: string[] = [];
const DICAS = {
  bastidores: { passo: 1, texto: "Agora que você viu as três plataformas, veja como fizemos." },
  auvox: { passo: 2, texto: "Agora que você viu os bastidores, conheça a equipe que fez o Intermedi." },
} as const;
type DicaId = keyof typeof DICAS;

/** Dica de etapa (mesmo visual do guia prático) acima da linha que acabou de aparecer. */
function DicaEtapa({ id }: { id: DicaId }) {
  const ref = useRef<HTMLDivElement>(null);
  // a linha nova pode estar fora da tela (no celular): rola até ela uma vez
  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => ref.current?.scrollIntoView({ block: "center", behavior: reduzir ? "auto" : "smooth" }), 500);
    return () => window.clearTimeout(t);
  }, [id]);
  const { passo, texto } = DICAS[id];
  return (
    <div ref={ref} className="central-dica" role="status">
      <div className="central-dica-topo">
        <span className="central-dica-marca">Novo · passo extra {passo} de 2</span>
        <button type="button" className="central-dica-fechar" onClick={() => marcarDicaVista(id)} aria-label="Fechar a dica">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <p>{texto}</p>
      <span className="central-dica-trilho" aria-hidden="true">
        <i className="is-feito" />
        <i className={passo === 2 ? "is-feito" : undefined} />
      </span>
    </div>
  );
}

function Desbloqueados({ tresVistas, bastidoresVisto, dicasVistas }: { tresVistas: boolean; bastidoresVisto: boolean; dicasVistas: string[] }) {
  const seta = (
    <svg className="central-extra-seta" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
  );
  // As duas linhas ficam sempre visíveis; a dica de etapa só acompanha quem fez o percurso.
  const dica: DicaId | null = !bastidoresVisto
    ? (tresVistas && !dicasVistas.includes("bastidores") ? "bastidores" : null)
    : (tresVistas && !dicasVistas.includes("auvox") ? "auvox" : null);
  return (
    <ul className="central-extras" aria-label="Mais sobre o Intermedi">
      <li>
        {dica === "bastidores" && <DicaEtapa id="bastidores" />}
        <Link to="/bastidores" className={`central-extra${dica === "bastidores" ? " is-destaque" : ""}`} data-track="central:bastidores">
          <span className="central-extra-equipe" aria-hidden="true">
            {PESSOAS.map((p) => (
              <span key={p.id} style={{ background: p.cor }}>{fotoDe(p.nome) ? <img src={fotoDe(p.nome)!} alt="" /> : p.nome.charAt(0)}</span>
            ))}
          </span>
          <span className="central-extra-texto">Como construímos?</span>
          {seta}
        </Link>
      </li>
      <li>
        {dica === "auvox" && <DicaEtapa id="auvox" />}
        <a
          className={`central-extra${dica === "auvox" ? " is-destaque" : ""}`}
          href={AUVOX.site}
          target="_blank"
          rel="noopener noreferrer"
          data-track="central:auvox"
          onClick={() => marcarDicaVista("auvox")}
        >
          <span className="central-extra-marca" aria-hidden="true">
            {LOGO_AUVOX && <img src={LOGO_AUVOX} alt="" width="28" height="28" />}
          </span>
          <span className="central-extra-texto">Quer saber mais sobre como foi a vida da Auvox? Entre já no site</span>
          {seta}
          <span className="sr-only"> (abre em outra aba)</span>
        </a>
      </li>
    </ul>
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
  const [avaliando, setAvaliando] = useState(false);
  const nome = usePaciente((p) => p.nome);
  // Boas-vindas (marca, tempo e nome) antes de mostrar as três experiências.
  const precisaBoasVindas = situacao === "nenhuma" || (situacao === "ativa" && !nome);
  // Fica aberta até a animação de saída terminar (a sessão e o nome mudam antes disso).
  const [emBoasVindas, setEmBoasVindas] = useState(precisaBoasVindas);
  // Depois das três experiências: agradecimento, uma única vez por sessão.
  const agradecimentoVisto = useProgresso((p) => p.agradecimentoVisto);
  const bastidoresVisto = useProgresso((p) => Boolean(p.bastidoresVisto));
  const dicasVistas = useProgresso((p) => p.dicasVistas ?? SEM_DICAS);
  const mostrarAgradecimento = situacao === "ativa" && totalVisitadas === EXPERIENCIAS.length && !agradecimentoVisto && !avaliando;

  useEffect(() => {
    document.title = "Intermedi Demo";
    window.scrollTo({ top: 0 });
  }, []);

  function escolher(id: ExperienciaId) {
    if (!verificarSessao()) return;
    navigate(EXPERIENCIAS.find((e) => e.id === id)!.rota);
  }

  // Quem tentou abrir uma experiência direto pelo endereço vai para ela depois das boas-vindas.
  function concluirBoasVindas() {
    setEmBoasVindas(false);
    window.scrollTo({ top: 0 });
    if (pedido) escolher(pedido);
  }

  if (precisaBoasVindas || emBoasVindas) {
    return <BoasVindasDemo jaIniciada={situacao === "ativa"} onConcluir={concluirBoasVindas} />;
  }

  return (
    <div className="central">
      <header className="central-topo">
        <img className="central-logo" src={logo} alt="Intermedi" width="1920" height="1080" />
        <div className="central-topo-direita">
          <SessaoTopo visitadas={totalVisitadas} />
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
            {nome && <p className="central-ola">Olá, {nome}</p>}
            <h1>Como deseja explorar o Intermedi?</h1>
          </div>

          <ul className="central-opcoes" aria-label="Experiências">
            {EXPERIENCIAS.map((exp, indice) => {
              const visitada = Boolean(visitadas[exp.id]);
              const agora = agoraDe[exp.id];
              return (
                <li key={exp.id} style={{ "--i": indice } as React.CSSProperties}>
                  <button
                    type="button"
                    className={`central-opcao central-opcao-${exp.id}${visitada ? " is-visitada" : ""}`}
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
                      {agora && <span className="central-opcao-agora" aria-live="polite">{agora}</span>}
                    </span>
                    <span className="central-opcao-ir" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                    </span>
                    {visitada && (
                      <span className="central-selo is-visitada">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 12.5 4 4 8-9" /></svg>
                        Visitada
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {situacao === "ativa" && <Desbloqueados tresVistas={agradecimentoVisto} bastidoresVisto={bastidoresVisto} dicasVistas={dicasVistas} />}

          <SobreAmostra />
        </div>

        <aside className="central-lateral">

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
        <p>
          Versão demonstrativa · Um produto{" "}
          <a href="https://auvox.vercel.app" target="_blank" rel="noopener noreferrer">Auvox</a>
          {" · "}
          <Link to="/bastidores">Bastidores</Link>
        </p>
      </footer>

      {mostrarAgradecimento && (
        <Agradecimento
          nome={nome}
          onAvaliar={() => {
            marcarAgradecimentoVisto();
            setAvaliando(true);
          }}
          onVoltar={marcarAgradecimentoVisto}
        />
      )}
      {avaliando && <AvaliacaoDialogo onFechar={() => setAvaliando(false)} />}
    </div>
  );
}
