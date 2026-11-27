import { Component, Suspense, lazy, useCallback, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Central from "./pages/Central";
import { LimiteDeFalha } from "./shared/Falha";
import { useSituacaoSessao, useVigiaSessao } from "./session/hooks";
import { ConvitesPosVisita } from "./shared/Convites";
import type { ExperienciaId } from "./types";
import { ensaioAtual, faseInicial } from "./lancamento/fase";

// Cada experiência é um pedaço separado do bundle: quem abre só o aplicativo
// nunca baixa o código e o CSS das plataformas do gerente, e vice-versa.
const GerenteExperiencia = lazy(() => import("./experiences/gerente/GerenteExperiencia"));
const PacienteApp = lazy(() => import("./experiences/paciente/PacienteApp"));
const Encerrada = lazy(() => import("./pages/Encerrada"));
const Bastidores = lazy(() => import("./pages/Bastidores"));
const Apresentacao = lazy(() => import("./pages/Apresentacao"));
const NaoEncontrada = lazy(() => import("./pages/NaoEncontrada"));
// Lançamento (contagem e abertura): só baixado por quem ainda vai vê-lo.
const Lancamento = lazy(() => import("./lancamento/Lancamento"));
const SeloEnsaio = lazy(() => import("./lancamento/SeloEnsaio"));

function Carregando() {
  return (
    <div className="demo-carregando" role="status">
      <span>Carregando a experiência…</span>
    </div>
  );
}

/** Proteção local de sessão (só de interface: ver README, "Limitações"). */
function ExigeSessao({ experiencia, children }: { experiencia: ExperienciaId; children: ReactNode }) {
  const situacao = useSituacaoSessao();
  if (situacao === "expirada") return <Navigate to="/encerrada" replace />;
  if (situacao === "nenhuma") return <Navigate to="/" replace state={{ pedir: experiencia }} />;
  return <>{children}</>;
}

function Rotas() {
  useVigiaSessao();
  const situacao = useSituacaoSessao();
  const { pathname } = useLocation();
  if (situacao === "expirada" && pathname !== "/encerrada") return <Navigate to="/encerrada" replace />;
  return (
    <Suspense fallback={<Carregando />}>
      <ConvitesPosVisita />
      <Routes>
        <Route path="/" element={<Central />} />
        <Route
          path="/solicitante/*"
          element={<ExigeSessao experiencia="solicitante"><GerenteExperiencia key="solicitante" experiencia="solicitante" /></ExigeSessao>}
        />
        <Route
          path="/fornecedora/*"
          element={<ExigeSessao experiencia="fornecedora"><GerenteExperiencia key="fornecedora" experiencia="fornecedora" /></ExigeSessao>}
        />
        <Route path="/aplicativo/*" element={<ExigeSessao experiencia="paciente"><PacienteApp /></ExigeSessao>} />
        <Route path="/bastidores" element={<Bastidores />} />
        <Route path="/bastidores/apresentacao" element={<Apresentacao />} />
        <Route path="/encerrada" element={situacao === "expirada" ? <Encerrada /> : <Navigate to="/" replace />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </Suspense>
  );
}

/** Se a camada de lançamento falhar (ou não carregar), a plataforma abre normalmente. */
class SeguraLancamento extends Component<{ onFalha: () => void; children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false };
  static getDerivedStateFromError() {
    return { falhou: true };
  }
  componentDidCatch() {
    this.props.onFalha();
  }
  render() {
    return this.state.falhou ? null : this.props.children;
  }
}

export default function App() {
  // Antes do lançamento só a contagem; no zero (ou na primeira visita depois
  // dele) a abertura; depois, a plataforma. Ela é montada por baixo da
  // abertura no fim do filme, para a passagem não ter corte.
  const [fase] = useState(faseInicial);
  const [lancando, setLancando] = useState(fase !== "demo");
  const [plataforma, setPlataforma] = useState(fase === "demo");
  const montarPlataforma = useCallback(() => setPlataforma(true), []);
  const concluir = useCallback(() => {
    setPlataforma(true);
    setLancando(false);
  }, []);
  return (
    <>
      {plataforma && (
        <BrowserRouter>
          <LimiteDeFalha>
            <Rotas />
          </LimiteDeFalha>
        </BrowserRouter>
      )}
      {lancando && fase !== "demo" && (
        <SeguraLancamento onFalha={concluir}>
          <Suspense fallback={<div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0E6B50" }} />}>
            <Lancamento inicio={fase} onMontarDemo={montarPlataforma} onConcluir={concluir} />
          </Suspense>
        </SeguraLancamento>
      )}
      {ensaioAtual() && (
        <Suspense fallback={null}>
          <SeloEnsaio />
        </Suspense>
      )}
    </>
  );
}
