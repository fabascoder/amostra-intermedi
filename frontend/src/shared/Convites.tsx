// Convites depois das três experiências. A cada 2 minutos aparece um, na ordem:
// avaliar a apresentação, conhecer a Auvox, o Instagram da Auvox e os
// bastidores. Cada um aparece uma vez por sessão; fechar ou aceitar agenda o
// próximo. Nunca aparece por cima de outra janela aberta.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AUVOX, CONVITE_INTERVALO_MS } from "../config/demo";
import { PESSOAS } from "../data/bastidores";
import { useAvaliacoes } from "../demoServices/feedbackService";
import { useProgresso, useSituacaoSessao } from "../session/hooks";
import { agendarConvite, progressoStore } from "../session/session";
import { LOGO_AUVOX } from "./AssinaturaAuvox";
import { AvaliacaoDialogo } from "./Avaliacao";
import { Dialogo } from "./Dialogo";
import "./convites.css";

type ConviteId = "avaliar" | "auvox" | "instagram" | "bastidores";
const ORDEM: ConviteId[] = ["avaliar", "auvox", "instagram", "bastidores"];
const SEM_CONVITES = { proximoEm: null, vistos: [] as string[] };

export function ConvitesPosVisita() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const situacao = useSituacaoSessao();
  const visitadas = useProgresso((p) => Object.keys(p.visitadas).length);
  const convites = useProgresso((p) => p.convites ?? SEM_CONVITES);
  const jaAvaliou = useAvaliacoes().length > 0;
  const [aberto, setAberto] = useState<ConviteId | null>(null);
  const [avaliando, setAvaliando] = useState(false);
  const pronto = situacao === "ativa" && visitadas >= 3;

  // Viu as três: o primeiro convite chega 2 minutos depois.
  useEffect(() => {
    if (pronto && convites.proximoEm === null && !convites.vistos.length) agendarConvite(null, CONVITE_INTERVALO_MS);
  }, [pronto, convites.proximoEm, convites.vistos.length]);

  useEffect(() => {
    if (!pronto || aberto || avaliando) return undefined;
    const conferir = () => {
      const c = progressoStore.get().convites ?? SEM_CONVITES;
      if (!c.proximoEm || Date.now() < c.proximoEm) return;
      if (document.querySelector("dialog[open]")) return; // espera a outra janela fechar
      const proximo = ORDEM.find((id) => !c.vistos.includes(id) && !(id === "avaliar" && jaAvaliou) && !(id === "bastidores" && pathname === "/bastidores"));
      if (proximo) setAberto(proximo);
    };
    conferir();
    const t = window.setInterval(conferir, 3000);
    return () => window.clearInterval(t);
  }, [pronto, aberto, avaliando, jaAvaliou, pathname]);

  function fechar() {
    if (aberto) agendarConvite(aberto, CONVITE_INTERVALO_MS);
    setAberto(null);
  }

  return (
    <>
      {aberto === "avaliar" && (
        <ConviteAvaliar onAvaliar={() => { fechar(); setAvaliando(true); }} onFechar={fechar} />
      )}
      {aberto === "auvox" && <ConviteAuvox onFechar={fechar} />}
      {aberto === "instagram" && <ConviteInstagram onFechar={fechar} />}
      {aberto === "bastidores" && (
        <ConviteBastidores onVer={() => { fechar(); navigate("/bastidores"); }} onFechar={fechar} />
      )}
      {avaliando && <AvaliacaoDialogo onFechar={() => setAvaliando(false)} />}
    </>
  );
}

function ConviteAvaliar({ onAvaliar, onFechar }: { onAvaliar: () => void; onFechar: () => void }) {
  return (
    <Dialogo rotulo="Avalie a apresentação" onFechar={onFechar} className="convite convite-avaliar">
      <div className="convite-corpo">
        <div className="convite-estrelas" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} viewBox="0 0 24 24" style={{ "--i": i } as React.CSSProperties}>
              <path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.15 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9z" />
            </svg>
          ))}
        </div>
        <h2>Agora que você viu tudo, o que achou?</h2>
        <p className="convite-texto">Dê uma nota de 1 a 5 para a apresentação. Leva meio minuto.</p>
        <div className="convite-botoes">
          <button type="button" className="demo-botao" onClick={onAvaliar} autoFocus>Avaliar a apresentação</button>
          <button type="button" className="demo-botao-sec" onClick={onFechar}>Agora não</button>
        </div>
      </div>
    </Dialogo>
  );
}

function ConviteAuvox({ onFechar }: { onFechar: () => void }) {
  const site = AUVOX.site.replace(/^https?:\/\//, "");
  return (
    <Dialogo rotulo="Conheça a Auvox" onFechar={onFechar} className="convite convite-auvox">
      <div className="convite-corpo">
        <div className="convite-auvox-marca" aria-hidden="true">
          {LOGO_AUVOX && <img src={LOGO_AUVOX} alt="" width="104" height="104" />}
          <span className="convite-auvox-nome">
            {"auvox".split("").map((letra, i) => <b key={i} style={{ "--i": i } as React.CSSProperties}>{letra}</b>)}
          </span>
        </div>
        <h2>Você conheceu o Intermedi. Agora conheça a Auvox.</h2>
        <p className="convite-texto">A equipe que fez a plataforma das farmácias, o aplicativo e o servidor.</p>
        <div className="convite-botoes">
          <a className="demo-botao convite-link" href={AUVOX.site} target="_blank" rel="noopener noreferrer" onClick={onFechar}>
            Abrir {site}
          </a>
          <button type="button" className="demo-botao-sec" onClick={onFechar}>Agora não</button>
        </div>
      </div>
    </Dialogo>
  );
}

function ConviteInstagram({ onFechar }: { onFechar: () => void }) {
  const usuario = AUVOX.instagram.replace(/^@/, "");
  return (
    <Dialogo rotulo="Instagram da Auvox" onFechar={onFechar} className="convite convite-instagram">
      <div className="convite-corpo">
        <svg className="convite-insta" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="convite-insta-cor" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#f2a93b" />
              <stop offset="0.5" stopColor="#d6336c" />
              <stop offset="1" stopColor="#6a4fd1" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="52" height="52" rx="15" />
          <circle cx="32" cy="32" r="11.5" />
          <circle className="ponto" cx="46" cy="18" r="2.6" />
        </svg>
        <h2>Acompanhe a Auvox no Instagram</h2>
        <p className="convite-texto">
          {usuario ? `@${usuario}: os próximos passos do Intermedi e os bastidores da equipe.` : "Os próximos passos do Intermedi e os bastidores da equipe."}
        </p>
        <div className="convite-botoes">
          {usuario ? (
            <a className="demo-botao convite-link" href={`https://instagram.com/${usuario}`} target="_blank" rel="noopener noreferrer" onClick={onFechar}>
              Seguir @{usuario}
            </a>
          ) : (
            <button type="button" className="demo-botao" disabled>O perfil chega em breve</button>
          )}
          <button type="button" className="demo-botao-sec" onClick={onFechar}>Agora não</button>
        </div>
      </div>
    </Dialogo>
  );
}

function ConviteBastidores({ onVer, onFechar }: { onVer: () => void; onFechar: () => void }) {
  return (
    <Dialogo rotulo="Bastidores do Intermedi" onFechar={onFechar} className="convite convite-bastidores">
      <div className="convite-corpo">
        <div className="convite-equipe" aria-hidden="true">
          {PESSOAS.map((p, i) => (
            <span key={p.id} style={{ "--i": i, background: p.cor } as React.CSSProperties}>{p.nome.charAt(0)}</span>
          ))}
        </div>
        <h2>Quer ver os bastidores?</h2>
        <p className="convite-texto">Quem fez cada tela, as tecnologias, os diagramas e como o Intermedi foi feito.</p>
        <div className="convite-botoes">
          <button type="button" className="demo-botao" onClick={onVer} autoFocus>Ver os bastidores</button>
          <button type="button" className="demo-botao-sec" onClick={onFechar}>Agora não</button>
        </div>
      </div>
    </Dialogo>
  );
}
