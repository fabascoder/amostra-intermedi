// components/ManagerSidebar.jsx do intermedi-frontend: mesmo menu, mesmo
// indicador deslizante e mesmos ícones. Na demonstração o menu mostra só as
// telas que existem aqui, e o rodapé ganha "Trocar experiência" ao lado da
// unidade.
import { useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../../../assets/brand/logo-intermedi.webp";
import { PersonaIcon } from "../../../shared/icons";
import { TrocarExperiencia } from "../../../shared/Sessao";

function SidebarIcon({ name }) {
  if (["heart", "team", "manager"].includes(name)) return <PersonaIcon role={name === "heart" ? "paciente" : name === "manager" ? "gerente" : "funcionario"} size={22} />;
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    pill: (
      <>
        <path d="m9 4-5 5a6.4 6.4 0 0 0 9 9l5-5a6.4 6.4 0 0 0-9-9Z" />
        <path d="m7 7 9 9m-2-9 2 2" />
      </>
    ),
    pharmacy: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M10 21v-5h4v5M12 6v6m-3-3h6" />
      </>
    ),
    truck: (
      <>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.8" />
        <circle cx="17" cy="18" r="1.8" />
      </>
    ),
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

// Um único fundo de item ativo que desliza até o link da rota atual.
function useIndicadorAtivo(navRef) {
  const { pathname } = useLocation();
  const [posicao, setPosicao] = useState(null);
  const [pronto, setPronto] = useState(false);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const medir = () => {
      const ativo = nav.querySelector("a.active");
      setPosicao(ativo ? { x: ativo.offsetLeft, y: ativo.offsetTop, w: ativo.offsetWidth, h: ativo.offsetHeight } : null);
    };
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [navRef, pathname]);

  useLayoutEffect(() => {
    if (!posicao || pronto) return undefined;
    const quadro = requestAnimationFrame(() => setPronto(true));
    return () => cancelAnimationFrame(quadro);
  }, [posicao, pronto]);

  return { posicao, pronto };
}

export default function Sidebar({ basePath, unitName, links, pendingOrders = 0 }) {
  const navRef = useRef(null);
  const { posicao, pronto } = useIndicadorAtivo(navRef);
  return (
    <aside className="manager-sidebar">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div className="manager-sidebar-header">
        <Link to={basePath} className="manager-sidebar-brand">
          <img src={logo} alt="Intermedi — visão geral" width="1920" height="1080" />
        </Link>
        <span className="manager-sidebar-role">
          <span /> Espaço do gerente
        </span>
      </div>

      <div className="manager-sidebar-menu">
        <nav ref={navRef} aria-label="Menu do gerente" className={posicao ? "has-indicator" : undefined}>
          <span
            aria-hidden="true"
            className={`manager-sidebar-indicator${posicao ? " is-visible" : ""}${pronto ? " is-ready" : ""}`}
            style={posicao ? { width: posicao.w, height: posicao.h, transform: `translate(${posicao.x}px, ${posicao.y}px)` } : undefined}
          />
          {links.map(({ path, label, icon }) => (
            <NavLink key={path} end={!path} to={`${basePath}${path ? `/${path}` : ""}`} data-track={`menu:${path || "visao-geral"}`}>
              <span className="manager-sidebar-icon">
                <SidebarIcon name={icon} />
              </span>
              <span className="manager-sidebar-label">{label}</span>
              {path === "pedidos" && pendingOrders > 0 && (
                <span className="manager-sidebar-count" aria-label={`${pendingOrders} ${pendingOrders === 1 ? "pedido da rede pendente" : "pedidos da rede pendentes"}`}>
                  {pendingOrders}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="manager-sidebar-bottom">
        <div className="manager-sidebar-unit">
          <span className="manager-sidebar-unit-icon">
            <SidebarIcon name="pharmacy" />
          </span>
          <div>
            <span className="manager-sidebar-unit-heading">Unidade</span>
            <strong title={unitName}>{unitName}</strong>
          </div>
        </div>
        <TrocarExperiencia className="demo-trocar-lateral" />
      </div>
    </aside>
  );
}
