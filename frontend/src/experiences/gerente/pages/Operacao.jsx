// Operação 3D (pages/ManagerOperacao.jsx do intermedi-frontend), nas duas
// farmácias da demonstração. Os dados vêm dos mesmos serviços simulados das
// outras telas: estoque (com os pedidos já descontados), equipe e pedidos da rede.
//
// No celular a cena só funciona com o aparelho deitado: em pé aparece o aviso
// "Gire seu celular"; deitado, a cena ocupa a tela inteira.
import { Component, Suspense, lazy, useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router-dom";
import { equipe } from "../../../demoServices/pharmacyService";
import { estoqueDaFarmacia, listarRemedios } from "../../../demoServices/medicationService";
import { farmaciaPorId } from "../../../data/farmacias";
import { useGerente } from "../contexto";
import { useRelogio } from "../components/Rastreio";
import { montarOperacao } from "../lib/operacao";
import KpiStrip from "../operacao/KpiStrip";
import Inspector from "../operacao/Inspector";
import FlowStrip from "../operacao/FlowStrip";
import Fallback2D from "../operacao/Fallback2D";
import { VISTAS } from "../operacao3d/layout";
import { COR_SITUACAO, COR_STATUS } from "../operacao3d/cores";
import "../styles/operacao.css";

// three.js só é baixado por quem abre a cena
const IntermediScene = lazy(() => import("../operacao3d/IntermediScene"));

function suportaWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function useMediaQuery(query) {
  const assinar = useCallback((avisar) => {
    const lista = window.matchMedia(query);
    // Safari antigo só tem addListener
    if (lista.addEventListener) lista.addEventListener("change", avisar);
    else lista.addListener(avisar);
    return () => (lista.removeEventListener ? lista.removeEventListener("change", avisar) : lista.removeListener(avisar));
  }, [query]);
  return useSyncExternalStore(assinar, () => window.matchMedia(query).matches);
}

// Tamanho e orientação lidos da própria janela, e não de media queries: há
// celulares (e navegadores dentro de apps) que não informam "pointer: coarse"
// ou demoram a atualizar a orientação depois de girar.
function assinarTela(avisar) {
  window.addEventListener("resize", avisar);
  window.addEventListener("orientationchange", avisar);
  window.visualViewport?.addEventListener("resize", avisar);
  return () => {
    window.removeEventListener("resize", avisar);
    window.removeEventListener("orientationchange", avisar);
    window.visualViewport?.removeEventListener("resize", avisar);
  };
}
const temToque = () =>
  navigator.maxTouchPoints > 0 || window.matchMedia("(any-pointer: coarse)").matches || "ontouchstart" in window;
const LADO_MENOR_CELULAR = 600;
function useTela() {
  // cada leitura devolve um valor simples, para o React comparar sem recriar objetos
  const largura = useSyncExternalStore(assinarTela, () => window.innerWidth);
  const altura = useSyncExternalStore(assinarTela, () => window.innerHeight);
  const toque = useSyncExternalStore(assinarTela, temToque);
  return {
    // Celular: tela de toque com o lado menor estreito. Vale nas duas orientações.
    celular: toque && Math.min(largura, altura) <= LADO_MENOR_CELULAR,
    emPe: altura > largura,
    // a cena 3D cabe no layout normal: tela larga, ou tablet/celular grande deitado
    amplo: largura >= 768 || (toque && largura > altura && largura >= 560),
    desktop: largura >= 768,
  };
}

class LimiteDaCena extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }
  static getDerivedStateFromError(erro) {
    return { erro };
  }
  componentDidCatch(erro) {
    this.props.onErro(erro);
  }
  render() {
    return this.state.erro ? null : this.props.children;
  }
}

const LEGENDA_ESTOQUE = [
  ["ok", "Em estoque"],
  ["vencendo", "Vence em até 90 dias"],
  ["critico", "Crítico"],
  ["vencido", "Zerado ou vencido"],
];
const LEGENDA_EQUIPE = [
  ["atendimento", "Ocupado"],
  ["disponivel", "Disponível"],
  ["pausa", "Em pausa"],
  ["fora", "Fora do turno"],
];

/** Retrato da unidade no formato que a cena original espera. */
function useOperacaoDemo() {
  const { config, visao } = useGerente();
  const pedidos = useMemo(() => [...visao.enviados, ...visao.recebidos], [visao.enviados, visao.recebidos]);
  const emPreparo = pedidos.some((p) => p.status === "preparando");
  const agora = useRelogio(true, emPreparo ? 1000 : 30000);
  const momento = Math.max(agora, visao.agora);

  return useMemo(() => {
    const time = equipe(config.idFarmacia);
    const lista = time.funcionarios.map((f) => ({
      idFuncionario: f.id,
      nomeFuncionario: f.nome,
      cargoFuncionario: f.cargo,
      turnoFuncionario: f.turno,
      matriculaFuncionario: f.matricula,
      fotoFuncionario: null,
    }));
    const idPorNome = new Map(time.funcionarios.map((f) => [f.nome, f.id]));
    const farmacia = farmaciaPorId.get(config.idFarmacia);
    return montarOperacao({
      estoque: estoqueDaFarmacia(config.idFarmacia, visao.ajustes),
      catalogo: listarRemedios().map((r) => ({ idRemedio: r.idRemedio, categorias: r.categorias.join(",") })),
      resumo: {
        farmacia: { idFarmacia: config.idFarmacia, nomeFarmacia: farmacia?.nomeFarmacia ?? config.unidade },
        equipe: { lista },
      },
      chamados: [],
      pendentes: { pendentes: [], totalPendentes: 0 },
      pedidos: pedidos.map((p) => ({ ...p, idFuncionarioPreparo: idPorNome.get(p.nomeFuncionarioPreparo) ?? null })),
      gerente: { idGerente: `demo-${config.id}`, nome: config.gerente, idFarmacia: config.idFarmacia },
      agora: momento,
    });
  }, [config, visao.ajustes, pedidos, momento]);
}

/** Aviso do celular em pé: gire o aparelho para continuar. */
function GireOCelular({ voltar, abrirAssim }) {
  return (
    <div className="op-gire" role="dialog" aria-modal="true" aria-labelledby="op-gire-titulo">
      <div className="op-gire-figura" aria-hidden="true">
        <svg className="op-gire-seta" viewBox="0 0 120 120">
          <path d="M28 34a44 44 0 0 1 62 -6" />
          <path d="M84 18l7 10-12 3" />
        </svg>
        <div className="op-gire-celular">
          <span className="op-gire-tela">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
              <path d="M4 7.5 12 12l8-4.5M12 12v9" />
            </svg>
          </span>
        </div>
      </div>
      <h1 id="op-gire-titulo" className="op-gire-titulo">Gire seu celular</h1>
      <p>A Operação 3D funciona com o celular deitado. Assim o mapa da farmácia aparece inteiro.</p>
      <p className="op-gire-dica">A tela não girou? Desative o bloqueio de rotação do celular, ou</p>
      <button type="button" className="op-gire-assim" onClick={abrirAssim}>
        Abrir assim mesmo
      </button>
      <button type="button" className="op-gire-voltar" onClick={voltar} aria-label="Voltar à visão geral" title="Voltar à visão geral">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
      </button>
    </div>
  );
}

export default function Operacao() {
  const { config, abrirRemedio } = useGerente();
  const navigate = useNavigate();
  const operacao = useOperacaoDemo();

  const [selecionado, setSelecionado] = useState(null);
  const [aba, setAba] = useState("alertas");
  const [foco, setFoco] = useState(null);
  const [preferencia2d, setPreferencia2d] = useState(false);
  const [falha3d, setFalha3d] = useState("");
  const [tentativa3d, setTentativa3d] = useState(0);
  const [painelAberto, setPainelAberto] = useState(false);
  const [webgl] = useState(suportaWebGL);
  // celular com a rotação travada: a pessoa pode abrir a cena mesmo em pé
  const [abrirEmPe, setAbrirEmPe] = useState(false);
  const { celular, emPe, amplo, desktop } = useTela();
  const reduzirMovimento = useMediaQuery("(prefers-reduced-motion: reduce)");
  const inspetorRef = useRef(null);

  const telaCheia = celular && (!emPe || abrirEmPe);
  const usar3d = (amplo || telaCheia) && webgl && !falha3d && !preferencia2d;
  const motivo2d = !webgl
    ? "Este navegador não oferece WebGL, então a operação aparece como planta 2D."
    : falha3d || (!amplo ? "Em telas pequenas a operação aparece como planta 2D." : "");
  const tentarDeNovo = () => {
    setFalha3d("");
    setTentativa3d((t) => t + 1);
  };
  // Celulares derrubam a placa de vídeo ao trocar de app ou girar rápido: a cena
  // é remontada sozinha algumas vezes antes de cair para a planta 2D.
  const remontagens = useRef(0);
  const aoPerderContexto = useCallback(() => {
    if (remontagens.current < 3) {
      remontagens.current += 1;
      setTentativa3d((t) => t + 1);
      return;
    }
    setFalha3d("A placa de vídeo interrompeu a cena 3D. Mostrando a planta 2D.");
  }, []);

  const voltar = () => navigate(config.basePath);

  function selecionarDaLista(chave) {
    setSelecionado(chave);
    if (chave) setFoco({ tipo: "objeto", chave });
    if (telaCheia) setPainelAberto(true);
    else if (!desktop) inspetorRef.current?.scrollIntoView({ block: "start", behavior: reduzirMovimento ? "auto" : "smooth" });
  }
  function selecionarNaCena(chave) {
    setSelecionado(chave);
    if (telaCheia && chave) setPainelAberto(true);
  }
  function abrirIndicador(id) {
    if (id === "estoque") {
      setAba("estoque");
      setSelecionado(null);
      setFoco({ tipo: "vista", vista: "estoque" });
    } else if (id === "equipe") {
      setAba("equipe");
      setSelecionado(null);
      setFoco({ tipo: "vista", vista: "atendimento" });
    } else if (id === "chamados") {
      selecionarDaLista("chamados");
    } else if (id === "alertas") {
      setSelecionado("alertas");
      setFoco({ tipo: "vista", vista: "estoque" });
    } else if (id === "doca") {
      setAba("entregas");
      setSelecionado(null);
      setFoco({ tipo: "vista", vista: "doca" });
    } else if (id === "operacao") {
      setSelecionado("operacao");
    }
  }

  // "Ver detalhes" e "Ver perfil" do inspetor levam às telas que existem na demonstração.
  const acoes = {
    abrirPerfil(tipo, id) {
      if (tipo === "remedio") abrirRemedio(Number(id));
      else if (tipo === "pedido") navigate(`${config.basePath}/pedidos`);
      else navigate(`${config.basePath}/funcionarios`);
    },
    validarChamado() {
      navigate(`${config.basePath}/pedidos`);
    },
  };

  if (celular && emPe && !abrirEmPe) return <GireOCelular voltar={voltar} abrirAssim={() => setAbrirEmPe(true)} />;

  const cena = (
    <>
      <div className="op-canvas" aria-describedby="op-ajuda-3d">
        <LimiteDaCena key={tentativa3d} onErro={() => setFalha3d("A cena 3D não pôde ser carregada neste navegador. Mostrando a planta 2D.")}>
          <Suspense fallback={<p className="op-carregando" role="status">Montando a cena 3D…</p>}>
            <IntermediScene
              operacao={operacao}
              selecionado={selecionado}
              onSelecionar={selecionarNaCena}
              foco={foco}
              reduzirMovimento={reduzirMovimento}
              leve={celular}
              onContextoPerdido={aoPerderContexto}
            />
          </Suspense>
        </LimiteDaCena>
      </div>
      <div className="op-zoom" role="group" aria-label="Zoom da câmera">
        <button type="button" aria-label="Aproximar" onClick={() => setFoco({ tipo: "zoom", fator: 0.75 })}>+</button>
        <button type="button" aria-label="Afastar" onClick={() => setFoco({ tipo: "zoom", fator: 1.33 })}>−</button>
        <button type="button" aria-label="Voltar à visão geral" onClick={() => setFoco({ tipo: "vista", vista: "geral" })}>⌂</button>
      </div>
    </>
  );

  const vistas = (
    <div className="op-vistas" role="group" aria-label="Pontos de vista da câmera">
      {Object.entries(VISTAS).map(([id, v]) => (
        <button key={id} type="button" onClick={() => setFoco({ tipo: "vista", vista: id })}>
          {v.rotulo}
        </button>
      ))}
    </div>
  );

  const inspetor = (
    <Inspector
      operacao={operacao}
      selecionado={selecionado}
      aba={aba}
      onAba={setAba}
      onSelecionar={selecionarDaLista}
      onFechar={() => setSelecionado(null)}
      acoes={acoes}
    />
  );

  // Celular deitado: a cena ocupa a tela; os detalhes abrem num painel lateral.
  if (telaCheia) {
    return (
      <div className={`op-tela-cheia${emPe ? " is-em-pe" : ""}`} role="region" aria-label="Cena 3D da unidade">
        {usar3d ? cena : <Fallback2D operacao={operacao} selecionado={selecionado} motivo={motivo2d} onSelecionar={selecionarDaLista} />}
        {falha3d && webgl && (
          <button type="button" className="mgr-secondary op-tentar-3d op-tela-cheia-tentar" onClick={tentarDeNovo}>
            Tentar a cena 3D de novo
          </button>
        )}
        <div className="op-tela-cheia-topo">
          <button type="button" className="op-tela-cheia-sair" onClick={voltar} aria-label="Sair da Operação 3D">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <strong className="op-tela-cheia-titulo">Operação 3D</strong>
          {usar3d && vistas}
          <button type="button" className={`op-tela-cheia-detalhes${painelAberto ? " is-ativo" : ""}`} onClick={() => setPainelAberto((a) => !a)} aria-expanded={painelAberto}>
            Detalhes
          </button>
        </div>
        <aside className={`op-tela-cheia-painel${painelAberto ? " is-aberto" : ""}`} aria-label="Detalhes da operação" aria-hidden={!painelAberto}>
          {painelAberto && inspetor}
        </aside>
      </div>
    );
  }

  return (
    <>
      <header className="mgr-page-head op-cabecalho">
        <div>
          <h1>Operação 3D</h1>
          <p>
            Estoque, equipe e entregas da {config.unidade} em uma visão espacial. São os mesmos dados das outras telas,
            atualizados enquanto os pedidos andam.
          </p>
        </div>
        <Link className="mgr-primary" to={`${config.basePath}/remedios`}>
          Ver estoque <span>↗</span>
        </Link>
      </header>

      <KpiStrip operacao={operacao} onAbrir={abrirIndicador} />

      <section className="op-bancada">
        <div className={`op-palco${usar3d ? " is-3d" : ""}`} aria-label={usar3d ? "Cena 3D da unidade" : "Planta da unidade"} role="region">
          <div className="op-barra">
            {usar3d && vistas}
            {desktop && webgl && (
              <div className="op-modo" role="group" aria-label="Modo de visualização">
                <button type="button" aria-pressed={usar3d} onClick={() => { setPreferencia2d(false); setFalha3d(""); }}>3D</button>
                <button type="button" aria-pressed={!usar3d} onClick={() => setPreferencia2d(true)}>2D</button>
              </div>
            )}
          </div>

          {usar3d ? (
            <>
              {cena}
              <div className="op-legenda" aria-hidden="true">
                <span className="op-legenda-titulo">Estoque</span>
                {LEGENDA_ESTOQUE.map(([id, rotulo]) => (
                  <span key={id}><i style={{ background: COR_SITUACAO[id] }} />{rotulo}</span>
                ))}
                <span className="op-legenda-titulo">Equipe</span>
                {LEGENDA_EQUIPE.map(([id, rotulo]) => (
                  <span key={id}><i className="op-legenda-anel" style={{ borderColor: COR_STATUS[id] }} />{rotulo}</span>
                ))}
              </div>
              <p id="op-ajuda-3d" className="op-ajuda">
                Arraste para girar, use a roda do mouse para aproximar e o botão direito para mover. Pelo teclado, use a lista ao lado.
              </p>
            </>
          ) : (
            <>
              <Fallback2D operacao={operacao} selecionado={selecionado} motivo={motivo2d} onSelecionar={selecionarDaLista} />
              {falha3d && webgl && amplo && (
                <button type="button" className="mgr-secondary op-tentar-3d" onClick={tentarDeNovo}>
                  Tentar a cena 3D de novo
                </button>
              )}
            </>
          )}
        </div>

        <aside className="op-inspetor" ref={inspetorRef} aria-label="Detalhes da operação">
          {inspetor}
        </aside>
      </section>

      <FlowStrip fluxo={operacao.fluxo} onAbrir={abrirIndicador} />
      <p className="op-rodape">
        Posição nas prateleiras e status ao vivo da equipe são representações: o corredor é a categoria do remédio e o
        status vem do turno de cada funcionário.
      </p>
    </>
  );
}
