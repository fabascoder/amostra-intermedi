// Experiências de gerente (farmácia solicitante e farmácia fornecedora),
// montadas com a casca original da área do gerente do intermedi-frontend
// (pages/Manager.jsx): menu lateral, barra superior translúcida, sino,
// conta, conteúdo e avisos. O visitante entra já como gerente demonstrativo,
// sem login, e cada experiência guarda o próprio estado.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { agendarSolicitacao, useAvisosPedidos, usePedidos } from "../../demoServices/orderService";
import { useAviso } from "../../demoServices/notificationService";
import { usePaciente } from "../../demoServices/patientService";
import { concluirOnboarding, marcarVisita } from "../../session/session";
import { useProgresso } from "../../session/hooks";
import { ContadorSessao, TrocarExperiencia } from "../../shared/Sessao";
import { VideoPlataforma } from "../../shared/VideoPlataforma";
import BoasVindas from "./components/BoasVindas";
import Notificacoes from "./components/Notificacoes";
import PersonaAvatar from "./components/PersonaAvatar";
import { ToastRegion } from "./components/Remedios";
import Sidebar from "./components/Sidebar";
import { CONFIGS, type ExperienciaGerente } from "./config";
import { GerenteContexto, type ContextoGerente } from "./contexto";
import { equipe } from "../../demoServices/pharmacyService";
import { primeiroNome } from "./lib/util";
import Dashboard from "./pages/Dashboard";
import Remedios from "./pages/Remedios";
import Pedidos from "./pages/Pedidos";
import Funcionarios from "./pages/Funcionarios";
import Operacao from "./pages/Operacao";
import { DetalheRemedio } from "./pages/DetalheRemedio";
import { PedirARede } from "./pages/PedirARede";

import "./styles/personaTheme.css";
import "./styles/manager.css";
import "./styles/managerRefresh.css";
import "./styles/managerSidebar.css";
import "./styles/directory.css";
import "./styles/chamados.css";
import "./styles/remedios.css";
import "./styles/rastreio.css";
import "./styles/boasVindas.css";
import "./styles/preparos.css";
import "./styles/motion.css";
import "./styles/demo.css";

export default function GerenteExperiencia({ experiencia }: { experiencia: ExperienciaGerente }) {
  // O gerente é o próprio visitante: o nome informado nas boas-vindas.
  const nomeVisitante = usePaciente((p) => p.nome);
  const config = useMemo(
    () => ({ ...CONFIGS[experiencia], gerente: nomeVisitante || CONFIGS[experiencia].gerente }),
    [experiencia, nomeVisitante],
  );
  const { pathname } = useLocation();
  const onboardingConcluido = useProgresso((p) =>
    experiencia === "solicitante" ? p.onboardingSolicitanteConcluido : p.onboardingFornecedoraConcluido,
  );
  // decidido uma vez ao entrar: o guia aparece só na primeira visita desta experiência
  const [mostrarGuia] = useState(() => !onboardingConcluido);
  const visao = usePedidos(experiencia);
  const aviso = useAviso();
  const [pedindo, setPedindo] = useState<{ idRemedio?: number } | null>(null);
  const [remedioAberto, setRemedioAberto] = useState<number | null>(null);
  const time = equipe(config.idFarmacia);

  useEffect(() => {
    marcarVisita(experiencia);
    document.title = `${experiencia === "solicitante" ? "Farmácia solicitante" : "Farmácia fornecedora"} | Intermedi Demo`;
    return () => {
      document.title = "Intermedi Demo";
    };
  }, [experiencia]);

  // Os avisos de pedido só começam depois do guia, para não ficarem escondidos atrás dele.
  useAvisosPedidos(experiencia, onboardingConcluido);

  // Fornecedora: ~3 s depois de entrar (e de concluir o guia) chega a solicitação.
  useEffect(() => {
    if (experiencia === "fornecedora" && onboardingConcluido) agendarSolicitacao();
  }, [experiencia, onboardingConcluido]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const pedirARede = useCallback((idRemedio?: number) => setPedindo({ idRemedio }), []);
  const abrirRemedio = useCallback((idRemedio: number) => setRemedioAberto(idRemedio), []);
  const contexto = useMemo<ContextoGerente>(() => ({ config, visao, pedirARede, abrirRemedio }), [config, visao, pedirARede, abrirRemedio]);
  const pendentes = visao.recebidos.filter((p) => p.status === "solicitada").length;
  const naRaiz = pathname.replace(/\/$/, "") === config.basePath;

  return (
    <GerenteContexto.Provider value={contexto}>
      <div className="persona-accessibility">
        <div className="mgr-shell">
          {mostrarGuia && (
            <BoasVindas
              papel="gerente"
              base={config.basePath}
              aberto
              onConcluir={() => concluirOnboarding(experiencia)}
              pessoa={{ id: `demo-${experiencia}`, nome: config.gerente }}
              farmacia={{ id: config.idFarmacia, nome: config.unidade }}
              gerentes={time.outrosGerentes.map((nome, i) => ({ idGerente: `${experiencia}-g${i}`, nomeGerente: nome }))}
              equipe={time.funcionarios.map((f) => ({ idFuncionario: f.id }))}
              ocultarNoPasseio={experiencia === "fornecedora" ? ["pedir-a-rede"] : []}
              tarefas={config.tarefas}
            />
          )}
          <Sidebar basePath={config.basePath} unitName={config.unidade} links={config.links} pendingOrders={pendentes} />
          <div className="mgr-workspace">
            <div className="mgr-topbar">
              <span>
                <span className="mgr-topbar-unit-prefix">Painel de gestão</span>{" "}
                <span className="mgr-topbar-divider">/</span> <strong>{config.unidade}</strong>
              </span>
              <span className="demo-topbar-sessao">
                <ContadorSessao />
              </span>
              <Notificacoes experiencia={experiencia} basePath={config.basePath} visao={visao} />
              <div className="mgr-account">
                <span className="mgr-account-button is-estatico">
                  <PersonaAvatar className="mgr-account-avatar" role="gerente" photo={null} />
                  <span className="mgr-account-person">
                    <strong>{primeiroNome(config.gerente, "Gerente")}</strong>
                    <small>Gerente demonstrativo</small>
                  </span>
                </span>
                <TrocarExperiencia className="demo-trocar-topo" />
              </div>
            </div>
            <main id="conteudo" tabIndex={-1} className={`mgr-main${naRaiz ? "" : " directory-layout"}`}>
              <aside className="demo-beta-faixa" aria-label="Sobre esta versão">
                <span className="demo-beta-selo">Beta</span>
                <p>
                  Esta é uma amostra em versão beta: ainda faltam funcionalidades que a plataforma completa do Intermedi tem.
                </p>
                <VideoPlataforma className="demo-beta-video" />
              </aside>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="remedios" element={<Remedios />} />
                <Route path="pedidos" element={<Pedidos />} />
                <Route path="funcionarios" element={<Funcionarios />} />
                <Route path="operacao" element={<Operacao />} />
                <Route path="*" element={<Navigate to={config.basePath} replace />} />
              </Routes>
            </main>
            <footer className="mgr-footer">
              Intermedi <span>Conectando farmácias. Aproximando o cuidado. · Versão demonstrativa</span>
            </footer>
          </div>
          <ToastRegion message={aviso} />
          {pedindo && experiencia === "solicitante" && (
            <PedirARede idRemedioInicial={pedindo.idRemedio} onFechar={() => setPedindo(null)} />
          )}
          {remedioAberto !== null && (
            <DetalheRemedio
              idRemedio={remedioAberto}
              onFechar={() => setRemedioAberto(null)}
              onPedir={experiencia === "solicitante" ? (id: number) => { setRemedioAberto(null); setPedindo({ idRemedio: id }); } : undefined}
            />
          )}
        </div>
      </div>
    </GerenteContexto.Provider>
  );
}
