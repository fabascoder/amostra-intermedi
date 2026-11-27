import { Suspense, lazy, useCallback, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Central from "./pages/Central";
import { LimiteDeFalha } from "./shared/Falha";
import { useSituacaoSessao, useVigiaSessao } from "./session/hooks";
import { ConvitesPosVisita } from "./shared/Convites";
import { LANCAMENTO_MS, appLiberado } from "./session/lancamento";
import type { ExperienciaId } from "./types";

// Cada experiência é um pedaço separado do bundle: quem abre só o aplicativo
// nunca baixa o código e o CSS das plataformas do gerente, e vice-versa.
const GerenteExperiencia = lazy(() => import("./experiences/gerente/GerenteExperiencia"));
const PacienteApp = lazy(() => import("./experiences/paciente/PacienteApp"));
const Encerrada = lazy(() => import("./pages/Encerrada"));
const Bastidores = lazy(() => import("./pages/Bastidores"));
const Apresentacao = lazy(() => import("./pages/Apresentacao"));
const NaoEncontrada = lazy(() => import("./pages/NaoEncontrada"));
// Só baixada antes do lançamento; depois dele ninguém carrega este pedaço.
const Contagem = lazy(() => import("./pages/Contagem"));

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

export default function App() {
  // Antes do lançamento (config/demo.ts), qualquer endereço mostra só a contagem.
  const [liberado, setLiberado] = useState(() => appLiberado());
  const lancar = useCallback(() => setLiberado(true), []);
  if (!liberado && LANCAMENTO_MS !== null) {
    return (
      <LimiteDeFalha>
        <Suspense fallback={null}>
          <Contagem lancamentoMs={LANCAMENTO_MS} onLancar={lancar} />
        </Suspense>
      </LimiteDeFalha>
    );
  }
  return (
    <BrowserRouter>
      <LimiteDeFalha>
        <Rotas />
      </LimiteDeFalha>
    </BrowserRouter>
  );
}
