import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import logo from "../assets/brand/logo-intermedi.webp";
import { PERIODOS, faixaDeSlides, imagemDoSlide, rotuloDoSlide, type Periodo, type Slide } from "../data/apresentacao";
import { Dialogo } from "../shared/Dialogo";
import { ManagerIcon } from "../shared/icons";
import "./apresentacao.css";

// "Alexandre Santiago" -> "AS", "Beatriz" -> "B"
const iniciais = (nome: string) => {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes.at(-1)![0] : "")).toUpperCase();
};

const tituloCompleto = (s: Slide) => (s.parte ? `${s.titulo} — ${s.parte}` : s.titulo);

/**
 * Apresentação do TCC: uma aba por apresentador na linha do tempo. Cada aba
 * explica a parte dele e mostra os slides, cada um com uma explicação curta.
 */
export default function Apresentacao() {
  const [params, setParams] = useSearchParams();
  const daUrl = Number(params.get("aba"));
  const ativo = Number.isInteger(daUrl) && daUrl >= 0 && daUrl < PERIODOS.length ? daUrl : 0;
  const [aberto, setAberto] = useState<number | null>(null); // índice entre os slides com imagem
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const periodo = PERIODOS[ativo];
  const comImagem = periodo.slides.filter((s) => s.arquivo);
  const totalSlides = new Set(PERIODOS.flatMap((p) => p.slides.map((s) => s.numero)).filter((n) => n > 0)).size;

  useEffect(() => {
    document.title = "Apresentação | Bastidores | Intermedi Demo";
    return () => {
      document.title = "Intermedi Demo";
    };
  }, []);

  // a aba ativa fica visível na linha do tempo (no celular ela rola de lado)
  useEffect(() => {
    const aba = abas.current[ativo];
    const trilho = aba?.parentElement;
    if (!aba || !trilho) return;
    trilho.scrollTo({ left: aba.offsetLeft - (trilho.clientWidth - aba.offsetWidth) / 2, behavior: "smooth" });
  }, [ativo]);

  function escolher(i: number, focar = false) {
    setAberto(null);
    setParams(i === 0 ? {} : { aba: String(i) }, { replace: true });
    if (focar) abas.current[i]?.focus();
  }

  // setas, Home e End entre as abas (padrão de abas acessíveis)
  function teclar(e: KeyboardEvent<HTMLButtonElement>) {
    const ultimo = PERIODOS.length - 1;
    const destino =
      e.key === "ArrowRight" ? Math.min(ultimo, ativo + 1)
        : e.key === "ArrowLeft" ? Math.max(0, ativo - 1)
          : e.key === "Home" ? 0
            : e.key === "End" ? ultimo
              : null;
    if (destino === null) return;
    e.preventDefault();
    escolher(destino, true);
  }

  return (
    <div className="bast">
      <header className="bast-topo">
        <Link to="/" aria-label="Voltar à Central de Experiências">
          <img className="bast-logo" src={logo} alt="Intermedi" width="1920" height="1080" />
        </Link>
        <Link to="/bastidores" className="demo-trocar">
          <ManagerIcon name="arrowLeft" size={17} />
          Bastidores
        </Link>
      </header>

      <main className="bast-corpo" id="conteudo">
        <div className="bast-titulo">
          <h1>Apresentação</h1>
          <p>Quem apresentou cada parte do TCC. Toque em um nome na linha do tempo para ver a explicação e os slides daquela parte.</p>
        </div>

        <section className="bast-linha" aria-label="Linha do tempo da apresentação">
          <div className="bast-pontos" role="tablist" aria-label="Apresentadores">
            {PERIODOS.map((p, i) => (
              <button
                key={p.apresentador}
                ref={(el) => {
                  abas.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`aba-${i}`}
                aria-selected={i === ativo}
                aria-controls="painel-periodo"
                tabIndex={i === ativo ? 0 : -1}
                className={`bast-ponto${i === ativo ? " is-ativo" : ""}`}
                onClick={() => escolher(i)}
                onKeyDown={teclar}
              >
                <span className="bast-ponto-faixa">{faixaDeSlides(p.slides)}</span>
                <span className="bast-ponto-marca" aria-hidden="true" />
                <span className="bast-ponto-pessoa">
                  <span className="bast-avatar" aria-hidden="true">{iniciais(p.apresentador)}</span>
                  {p.apresentador}
                </span>
              </button>
            ))}
          </div>
          <p className="bast-resumo">
            {PERIODOS.length} apresentadores · capa e {totalSlides} slides
          </p>
        </section>

        <section className="bast-periodo" id="painel-periodo" role="tabpanel" aria-labelledby={`aba-${ativo}`} key={periodo.apresentador}>
          <div className="bast-periodo-cabeca">
            <span className="bast-avatar is-grande" aria-hidden="true">{iniciais(periodo.apresentador)}</span>
            <div>
              <h2>{periodo.apresentador}</h2>
              <p className="bast-periodo-faixa">{faixaDeSlides(periodo.slides)}</p>
            </div>
          </div>
          <p className="bast-explicacao">{periodo.resumo}</p>

          <ul className="bast-slides">
            {periodo.slides.map((s, i) => {
              const mini = imagemDoSlide(s.arquivo, true);
              const indice = comImagem.indexOf(s);
              return (
                <li key={`${s.numero}-${s.parte ?? i}`} style={{ "--i": Math.min(i, 6) } as React.CSSProperties}>
                  {mini ? (
                    <button type="button" className="bast-slide" onClick={() => setAberto(indice)} aria-label={`Ampliar o slide ${rotuloDoSlide(s)}: ${tituloCompleto(s)}`}>
                      <span className="bast-slide-imagem">
                        <img src={mini} alt="" width="480" height="270" loading="lazy" decoding="async" />
                      </span>
                      <SlideTexto slide={s} />
                    </button>
                  ) : (
                    <div className="bast-slide is-pendente">
                      <span className="bast-slide-imagem bast-slide-vazio">
                        <ManagerIcon name="clipboard" size={28} />
                        <span>Imagem ainda não enviada</span>
                      </span>
                      <SlideTexto slide={s} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {aberto !== null && comImagem[aberto] && (
        <VisorSlide periodo={periodo} slides={comImagem} indice={aberto} onMudar={setAberto} onFechar={() => setAberto(null)} />
      )}
    </div>
  );
}

function SlideTexto({ slide: s }: { slide: Slide }) {
  return (
    <span className="bast-slide-texto">
      <span className="bast-slide-legenda">
        <b>{rotuloDoSlide(s)}</b>
        {s.titulo}
      </span>
      {s.parte && <span className="bast-slide-parte">{s.parte}</span>}
      <span className="bast-slide-explicacao">{s.explicacao}</span>
    </span>
  );
}

function VisorSlide({ periodo, slides, indice, onMudar, onFechar }: {
  periodo: Periodo; slides: Slide[]; indice: number; onMudar: (i: number) => void; onFechar: () => void;
}) {
  const slide = slides[indice];
  const total = slides.length;

  useEffect(() => {
    const aoTeclar = (e: globalThis.KeyboardEvent) => {
      if (e.key === "ArrowRight" && indice < total - 1) onMudar(indice + 1);
      if (e.key === "ArrowLeft" && indice > 0) onMudar(indice - 1);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [indice, total, onMudar]);

  return (
    <Dialogo rotulo={`Slide ${rotuloDoSlide(slide)}: ${tituloCompleto(slide)}`} onFechar={onFechar} className="bast-visor">
      <figure className="bast-visor-figura">
        <img key={slide.arquivo} src={imagemDoSlide(slide.arquivo)} alt={`Slide ${rotuloDoSlide(slide)}: ${tituloCompleto(slide)}`} width="1600" height="900" />
        <figcaption>
          <span className="bast-visor-texto">
            <strong>{slide.numero === 0 ? "Capa" : `Slide ${slide.numero}`} · {tituloCompleto(slide)}</strong>
            <span>{slide.explicacao}</span>
            <small>Apresentado por {periodo.apresentador}</small>
          </span>
          <span className="bast-visor-nav">
            <button type="button" onClick={() => onMudar(indice - 1)} disabled={indice === 0} aria-label="Slide anterior">
              <ManagerIcon name="arrowLeft" size={18} />
            </button>
            <span aria-live="polite">{indice + 1} de {total}</span>
            <button type="button" onClick={() => onMudar(indice + 1)} disabled={indice === total - 1} aria-label="Próximo slide">
              <span className="bast-seta-direita"><ManagerIcon name="arrowLeft" size={18} /></span>
            </button>
          </span>
        </figcaption>
      </figure>
    </Dialogo>
  );
}
