// Aplicativo do paciente, adaptado do intermedi-app (Expo/React Native) para
// React na web. No celular ocupa a tela inteira, como um app. No computador a
// interface mobile fica numa coluna central com a proporção de um telefone, e
// ao lado aparecem só a apresentação e os atalhos para as telas do app.
import { useEffect, useRef } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import wordmark from "../../assets/brand/wordmark.png";
import { usePaciente } from "../../demoServices/patientService";
import { marcarVisita } from "../../session/session";
import { MASCOTES } from "../../shared/Mascote";
import { ContadorSessao, TrocarExperiencia } from "../../shared/Sessao";
import { Ionicon } from "./components/Ionicon";
import Broto from "./telas/Broto";
import Buscar from "./telas/Buscar";
import Comprimidos from "./telas/Comprimidos";
import Entrada from "./telas/Entrada";
import Farmacia from "./telas/Farmacia";
import Farmacias from "./telas/Farmacias";
import Favoritos from "./telas/Favoritos";
import Inicio from "./telas/Inicio";
import Mascote from "./telas/Mascote";
import Medicamento from "./telas/Medicamento";
import Notificacoes from "./telas/Notificacoes";
import Perfil from "./telas/Perfil";
import Remedios from "./telas/Remedios";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./app.css";

const ABAS = [
  { rota: "farmacias", titulo: "Farmácias", contorno: "add-circle-outline", cheio: "add-circle" },
  { rota: "remedios", titulo: "Remédios", contorno: "bandage-outline", cheio: "bandage" },
  { rota: "", titulo: "Início", contorno: "home-outline", cheio: "home" },
  { rota: "broto", titulo: "", contorno: "chatbubble-ellipses-outline", cheio: "chatbubble-ellipses" },
  { rota: "favoritos", titulo: "Favoritos", contorno: "heart-outline", cheio: "heart" },
  { rota: "perfil", titulo: "Perfil", contorno: "person-outline", cheio: "person" },
];

/** Barra flutuante do design: só a aba ativa mostra o nome dentro da pílula verde. */
function BarraAbas() {
  const mascote = usePaciente((p) => p.mascote);
  return (
    <nav className="a-abas-barra" aria-label="Navegação do aplicativo">
      <div className="a-abas-pilula">
        {ABAS.map((aba) => {
          const titulo = aba.rota === "broto" ? MASCOTES[mascote].nome : aba.titulo;
          return (
            <NavLink key={aba.rota} to={`/aplicativo${aba.rota ? `/${aba.rota}` : ""}`} end={!aba.rota} className="a-aba" aria-label={titulo}>
              {({ isActive }) => (
                <>
                  <Ionicon name={isActive ? aba.cheio : aba.contorno} size={22} />
                  {isActive && <span className="a-aba-rotulo">{titulo}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

const TELAS_SEM_ABAS = /\/aplicativo\/(medicamento|farmacia|notificacoes|comprimidos|mascote|buscar)\b/;

function Telefone() {
  const { pathname } = useLocation();
  const tela = useRef<HTMLDivElement>(null);
  const comAbas = !TELAS_SEM_ABAS.test(pathname);
  // cada tela começa do topo, como num app
  useEffect(() => {
    tela.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <div className={`a-telefone${comAbas ? " com-abas" : ""}`} ref={tela}>
      <div className="a-telefone-tela" key={pathname}>
        <Routes>
          <Route index element={<Inicio />} />
          <Route path="remedios" element={<Remedios />} />
          <Route path="buscar" element={<Buscar />} />
          <Route path="farmacias" element={<Farmacias />} />
          <Route path="broto" element={<Broto />} />
          <Route path="favoritos" element={<Favoritos />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="medicamento/:id" element={<Medicamento />} />
          <Route path="farmacia/:id" element={<Farmacia />} />
          <Route path="notificacoes" element={<Notificacoes />} />
          <Route path="comprimidos" element={<Comprimidos />} />
          <Route path="mascote" element={<Mascote />} />
          <Route path="*" element={<Navigate to="/aplicativo" replace />} />
        </Routes>
      </div>
      {comAbas && <BarraAbas />}
    </div>
  );
}

/** Coluna ao lado do telefone, só no computador. */
function Apresentacao() {
  const navigate = useNavigate();
  const nome = usePaciente((p) => p.nome);
  const atalhos = [
    { titulo: "Buscar um remédio", texto: "Veja onde tem estoque perto de você.", destino: "/aplicativo/buscar", icone: "search-outline" },
    { titulo: "Ver as farmácias", texto: "Horários e o estoque de cada unidade.", destino: "/aplicativo/farmacias", icone: "add-circle-outline" },
    { titulo: "Montar sua rotina", texto: "Adicione um remédio e confirme as doses.", destino: "/aplicativo/comprimidos", icone: "alarm-outline" },
    { titulo: "Perguntar ao mascote", texto: "Respostas sobre remédios e o app.", destino: "/aplicativo/broto", icone: "chatbubble-ellipses-outline" },
  ];
  return (
    <aside className="a-apresentacao" aria-label="Sobre o aplicativo">
      <img src={wordmark} alt="Intermedi" width="1646" height="1046" className="a-apresentacao-marca" />
      <h2 className="a-apresentacao-titulo">Aplicativo do paciente</h2>
      <p className="a-apresentacao-texto">
        {nome ? `${nome}, este é o app que o paciente usa para achar o remédio na farmácia certa e cuidar das doses.` : "O app que o paciente usa para achar o remédio na farmácia certa e cuidar das doses."}
      </p>
      {nome && (
        <ul className="a-apresentacao-atalhos">
          {atalhos.map((a) => (
            <li key={a.titulo}>
              <button type="button" onClick={() => navigate(a.destino)}>
                <Ionicon name={a.icone} size={20} />
                <span>
                  <strong>{a.titulo}</strong>
                  <small>{a.texto}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="a-apresentacao-rodape">
        <ContadorSessao />
        <TrocarExperiencia />
      </div>
    </aside>
  );
}

export default function PacienteApp() {
  const nome = usePaciente((p) => p.nome);
  const mascote = usePaciente((p) => p.mascote);
  useEffect(() => {
    marcarVisita("paciente");
    document.title = "Aplicativo do paciente | Intermedi Demo";
    return () => {
      document.title = "Intermedi Demo";
    };
  }, []);
  return (
    <div className="app-paciente" data-mascote={mascote}>
      <div className="a-palco">
        <Apresentacao />
        <div className="a-moldura">{nome ? <Telefone /> : <div className="a-telefone"><Entrada /></div>}</div>
      </div>
    </div>
  );
}
