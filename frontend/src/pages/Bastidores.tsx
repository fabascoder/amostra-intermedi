// Bastidores: quem fez o Intermedi e como. Tudo aqui vem dos repositórios da
// Auvox (ver data/bastidores.ts). A tela é para mexer: escolher uma pessoa
// destaca o que ela fez na linha do tempo, os diagramas respondem ao toque.
// A Apresentação do TCC (quem apresentou cada slide) abre em tela própria.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/brand/logo-intermedi.webp";
import {
  ATORES, CASOS_DE_USO, CLASSES, COMMITS_POR_MES, LINHA_DO_TEMPO, PESSOAS, RELACOES, TECNOLOGIAS,
  type Ator, type ClasseId, type PessoaId,
} from "../data/bastidores";
import { PERIODOS, imagemDoSlide } from "../data/apresentacao";
import { AssinaturaAuvox } from "../shared/AssinaturaAuvox";
import { marcarBastidoresVisto } from "../session/session";
import "./bastidores.css";

const pessoa = (id: PessoaId) => PESSOAS.find((p) => p.id === id)!;
const TOTAL_COMMITS = COMMITS_POR_MES.reduce((s, m) => s + m.app + m.web + m.servidor, 0);
const SECOES = [
  ["equipe", "Equipe"],
  ["tecnologias", "Tecnologias"],
  ["casos", "Casos de uso"],
  ["classes", "Classes"],
  ["como", "Como foi feito"],
] as const;

/** Marca a seção quando ela entra na tela (as barras enchem nessa hora). */
function useVisivel<T extends Element>() {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return undefined;
    }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisivel(true);
        obs.disconnect();
      }
    }, { rootMargin: "0px 0px -15% 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visivel] as const;
}

export default function Bastidores() {
  const [escolhida, setEscolhida] = useState<PessoaId | null>(null);
  const [secao, setSecao] = useState<string>("equipe");

  useEffect(() => {
    document.title = "Bastidores | Intermedi Demo";
    window.scrollTo({ top: 0 });
    marcarBastidoresVisto(); // libera "Conheça a Auvox" na Central
    return () => { document.title = "Intermedi Demo"; };
  }, []);

  // Navegação de seções acompanha a rolagem.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const obs = new IntersectionObserver((entradas) => {
      const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visivel) setSecao(visivel.target.id);
    }, { rootMargin: "-30% 0px -60% 0px" });
    SECOES.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  function irPara(id: string) {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className="bt">
      <header className="bt-topo">
        <Link to="/" className="bt-voltar" aria-label="Voltar à amostra">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
          Amostra
        </Link>
        <img className="bt-logo" src={logo} alt="Intermedi" width="1920" height="1080" />
      </header>

      <main id="conteudo">
        <section className="bt-abertura" aria-labelledby="bt-titulo">
          <p className="bt-sobre">Bastidores</p>
          <h1 id="bt-titulo">Quem fez o Intermedi, e como</h1>
          <p className="bt-lead">
            {PESSOAS.length} pessoas da Auvox, 3 repositórios e {TOTAL_COMMITS} commits, de 26 de julho a 19 de novembro de 2026.
          </p>
          <EntradaApresentacao />
          <GraficoCommits />
        </section>

        <nav className="bt-nav" aria-label="Seções dos bastidores">
          <div className="bt-nav-trilho">
            {SECOES.map(([id, nome]) => (
              <button key={id} type="button" className={secao === id ? "is-atual" : undefined} aria-current={secao === id ? "true" : undefined} onClick={() => irPara(id)}>
                {nome}
              </button>
            ))}
          </div>
        </nav>

        <Equipe escolhida={escolhida} onEscolher={setEscolhida} />
        <Tecnologias />
        <CasosDeUso />
        <Classes />
        <ComoFoiFeito escolhida={escolhida} />
      </main>

      <footer className="bt-rodape">
        <AssinaturaAuvox />
        <Link to="/" className="bt-rodape-voltar">Voltar à amostra</Link>
      </footer>
    </div>
  );
}

/* ---------- Commits por mês (abertura) ---------- */
function GraficoCommits() {
  const [mes, setMes] = useState<string | null>("set");
  const max = Math.max(...COMMITS_POR_MES.map((m) => m.app + m.web + m.servidor));
  const atual = COMMITS_POR_MES.find((m) => m.mes === mes);
  const SERIES = [
    ["web", "Plataforma web", "var(--bt-web)"],
    ["servidor", "Servidor", "var(--bt-servidor)"],
    ["app", "Aplicativo", "var(--bt-app)"],
  ] as const;
  return (
    <figure className="bt-grafico">
      <div className="bt-grafico-colunas" role="group" aria-label="Commits por mês">
        {COMMITS_POR_MES.map((m, i) => {
          const total = m.app + m.web + m.servidor;
          return (
            <button
              key={m.mes}
              type="button"
              className={`bt-coluna${mes === m.mes ? " is-ativa" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
              aria-pressed={mes === m.mes}
              aria-label={`${m.mes}: ${total} commits`}
              onClick={() => setMes(m.mes)}
            >
              <span className="bt-coluna-total">{total}</span>
              <span className="bt-coluna-pilha" style={{ height: `${(total / max) * 100}%` }}>
                {SERIES.map(([chave, , cor]) => m[chave] > 0 && (
                  <i key={chave} style={{ flexGrow: m[chave], background: cor }} />
                ))}
              </span>
              <span className="bt-coluna-mes">{m.mes}</span>
            </button>
          );
        })}
      </div>
      <figcaption className="bt-grafico-legenda" aria-live="polite">
        {SERIES.map(([chave, nome, cor]) => (
          <span key={chave}>
            <i style={{ background: cor }} />
            {nome}
            {atual && <b>{atual[chave]}</b>}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/* ---------- Equipe ---------- */
function Equipe({ escolhida, onEscolher }: { escolhida: PessoaId | null; onEscolher: (p: PessoaId | null) => void }) {
  return (
    <section id="equipe" className="bt-secao" aria-labelledby="bt-equipe">
      <h2 id="bt-equipe">Equipe</h2>
      <p className="bt-secao-texto">Toque numa pessoa para destacar o que ela fez na linha do tempo do projeto.</p>
      <ul className="bt-equipe">
        {PESSOAS.map((p) => {
          const ativa = escolhida === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`bt-pessoa${ativa ? " is-ativa" : ""}${escolhida && !ativa ? " is-apagada" : ""}`}
                style={{ "--cor": p.cor } as React.CSSProperties}
                aria-pressed={ativa}
                onClick={() => onEscolher(ativa ? null : p.id)}
              >
                <span className="bt-avatar" aria-hidden="true">{p.nome.charAt(0)}</span>
                <span className="bt-pessoa-texto">
                  <strong>{p.nome}</strong>
                  <span>{p.fez}</span>
                </span>
                <span className="bt-pessoa-numeros">
                  <b>{p.commits}</b> commits
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- Apresentação do TCC (abre em /bastidores/apresentacao) ---------- */
function EntradaApresentacao() {
  const capas = ["slide-00", "slide-05-a", "slide-15-a"].map((a) => imagemDoSlide(a, true)).filter(Boolean) as string[];
  const totalSlides = new Set(PERIODOS.flatMap((p) => p.slides.map((s) => s.numero)).filter((n) => n > 0)).size;
  return (
    <Link to="/bastidores/apresentacao" className="bt-apresentacao">
      <span className="bt-apresentacao-pilha" aria-hidden="true">
        {capas.map((src, i) => (
          <img key={src} src={src} alt="" width="480" height="270" style={{ "--i": i } as React.CSSProperties} />
        ))}
      </span>
      <span className="bt-apresentacao-texto">
        <small className="bt-apresentacao-selo">Comece por aqui</small>
        <strong>Apresentação do TCC</strong>
        <span>Quem apresentou cada parte, com uma explicação de cada slide.</span>
        <small>{PERIODOS.length} apresentadores · {totalSlides} slides</small>
      </span>
      <span className="bt-apresentacao-ir" aria-hidden="true">
        <span className="bt-apresentacao-ir-rotulo">Ver a apresentação</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </span>
    </Link>
  );
}

/* ---------- Tecnologias ---------- */
function Tecnologias() {
  const [escolhida, setEscolhida] = useState<string>(`${TECNOLOGIAS[0].titulo}|${TECNOLOGIAS[0].itens[3].nome}`);
  return (
    <section id="tecnologias" className="bt-secao" aria-labelledby="bt-tecnologias">
      <h2 id="bt-tecnologias">Tecnologias</h2>
      <p className="bt-secao-texto">Toque numa tecnologia para ver para que ela serve no Intermedi.</p>
      <div className="bt-tecnologias">
        {TECNOLOGIAS.map((g) => {
          const item = g.itens.find((it) => `${g.titulo}|${it.nome}` === escolhida);
          return (
            <div key={g.titulo} className="bt-tec-grupo">
              <h3>{g.titulo}</h3>
              <div className="bt-tec-chips">
                {g.itens.map((it) => {
                  const id = `${g.titulo}|${it.nome}`;
                  return (
                    <button key={id} type="button" className={escolhida === id ? "is-ativo" : undefined} aria-pressed={escolhida === id} onClick={() => setEscolhida(id)}>
                      {it.nome}
                    </button>
                  );
                })}
              </div>
              {item && <p key={item.nome} className="bt-tec-uso" aria-live="polite"><b>{item.nome}:</b> {item.uso}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Casos de uso ---------- */
function CasosDeUso() {
  const [ator, setAtor] = useState<Ator>("gerente");
  const [caso, setCaso] = useState<string | null>(null);
  const casos = CASOS_DE_USO.filter((c) => c.atores.includes(ator));
  const L = 360;
  const passo = 44;
  const A = 30 + casos.length * passo;
  const ex = 228;
  const selecionado = casos.find((c) => c.nome === caso) ?? null;
  return (
    <section id="casos" className="bt-secao" aria-labelledby="bt-casos">
      <h2 id="bt-casos">Casos de uso</h2>
      <p className="bt-secao-texto">Quatro atores e o que cada um faz, tirado das permissões de cada rota do servidor. Toque num caso para ver a rota.</p>
      <div className="bt-atores" role="tablist" aria-label="Ator">
        {ATORES.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={ator === a.id} className={ator === a.id ? "is-ativo" : undefined} onClick={() => { setAtor(a.id); setCaso(null); }}>
            {a.nome}
            <small>{CASOS_DE_USO.filter((c) => c.atores.includes(a.id)).length}</small>
          </button>
        ))}
      </div>
      <div className="bt-diagrama">
        <svg key={ator} viewBox={`0 0 ${L} ${A}`} role="img" aria-label={`Diagrama de casos de uso do ${ATORES.find((a) => a.id === ator)!.nome}`}>
          <rect className="bt-uc-sistema" x="104" y="6" width={L - 110} height={A - 12} rx="14" />
          <text className="bt-uc-sistema-nome" x={L - 14} y="22" textAnchor="end">Intermedi</text>
          {casos.map((c, i) => {
            const y = 40 + i * passo;
            return (
              <path key={`l-${c.nome}`} className={`bt-uc-linha${caso === c.nome ? " is-ativa" : ""}`} d={`M70 ${A / 2} C 112 ${A / 2}, 112 ${y}, ${ex - 104} ${y}`} pathLength={1} style={{ "--i": i } as React.CSSProperties} />
            );
          })}
          <g className="bt-uc-ator" transform={`translate(46 ${A / 2 - 26})`}>
            <circle cx="0" cy="0" r="9" />
            <path d="M0 9v22M-14 17h28M0 31l-11 16M0 31l11 16" />
            <text x="0" y="64" textAnchor="middle">{ATORES.find((a) => a.id === ator)!.nome}</text>
          </g>
          {casos.map((c, i) => {
            const y = 40 + i * passo;
            const compartilhado = c.atores.length > 1;
            return (
              <g
                key={c.nome}
                className={`bt-uc-caso${caso === c.nome ? " is-ativo" : ""}${compartilhado ? " is-compartilhado" : ""}`}
                style={{ "--i": i } as React.CSSProperties}
                role="button"
                tabIndex={0}
                aria-pressed={caso === c.nome}
                onClick={() => setCaso(caso === c.nome ? null : c.nome)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCaso(caso === c.nome ? null : c.nome); } }}
              >
                <ellipse cx={ex} cy={y} rx="104" ry="17" />
                <text x={ex} y={y} textAnchor="middle" dominantBaseline="central">{c.nome}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="bt-uc-detalhe" aria-live="polite">
        {selecionado ? (
          <>
            <code>{selecionado.rota}</code>
            {selecionado.atores.length > 1 && <> · também: {selecionado.atores.filter((a) => a !== ator).map((a) => ATORES.find((x) => x.id === a)!.nome).join(", ")}</>}
          </>
        ) : (
          "Os casos com borda dupla são feitos por mais de um ator."
        )}
      </p>
    </section>
  );
}

/* ---------- Diagrama de classes ---------- */
const CX = [8, 128, 248];
const CY = [8, 124, 240, 356];
const BW = 104;
const BH = 70;
const centro = (id: ClasseId) => {
  const c = CLASSES.find((k) => k.id === id)!;
  return { x: CX[c.col] + BW / 2, y: CY[c.lin] + BH / 2 };
};

function Classes() {
  const [classe, setClasse] = useState<ClasseId>("farmacia");
  const atual = CLASSES.find((c) => c.id === classe)!;
  const rels = RELACOES.filter((r) => r.de === classe || r.para === classe);
  const ligadas = useMemo(() => new Set(RELACOES.filter((r) => r.de === classe || r.para === classe).flatMap((r) => [r.de, r.para])), [classe]);
  return (
    <section id="classes" className="bt-secao" aria-labelledby="bt-classes">
      <h2 id="bt-classes">Diagrama de classes</h2>
      <p className="bt-secao-texto">As tabelas do banco e como se ligam. Toque numa classe para ver os campos e as relações.</p>
      <div className="bt-diagrama">
        <svg viewBox="0 0 360 434" role="img" aria-label="Diagrama de classes do Intermedi">
          {RELACOES.map((r) => {
            const a = centro(r.de);
            const b = centro(r.para);
            const ativa = r.de === classe || r.para === classe;
            return <line key={`${r.de}-${r.para}`} className={`bt-cl-linha${ativa ? " is-ativa" : ""}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
          {CLASSES.map((c) => {
            const x = CX[c.col];
            const y = CY[c.lin];
            const ativa = c.id === classe;
            const apagada = !ligadas.has(c.id) && !ativa;
            return (
              <g
                key={c.id}
                className={`bt-cl${ativa ? " is-ativa" : ""}${apagada ? " is-apagada" : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={ativa}
                aria-label={`Classe ${c.nome}`}
                onClick={() => setClasse(c.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setClasse(c.id); } }}
              >
                <rect x={x} y={y} width={BW} height={BH} rx="8" />
                <path className="bt-cl-cab" d={`M${x} ${y + 22}h${BW}`} />
                <text className="bt-cl-nome" x={x + BW / 2} y={y + 15} textAnchor="middle">{c.nome}</text>
                {c.atributos.slice(0, 3).map((at, i) => (
                  <text key={at} className="bt-cl-attr" x={x + 7} y={y + 35 + i * 12}>{at}</text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="bt-cl-painel" aria-live="polite">
        <h3>{atual.nome}</h3>
        <div className="bt-cl-campos">
          {atual.atributos.map((at) => <code key={at}>{at}</code>)}
        </div>
        <ul className="bt-cl-rels">
          {rels.map((r) => {
            const outra = r.de === classe ? r.para : r.de;
            return (
              <li key={`${r.de}-${r.para}`}>
                <span className="bt-card">{r.de === classe ? `${r.card[0]} : ${r.card[1]}` : `${r.card[1]} : ${r.card[0]}`}</span>
                {r.frase}
                <button type="button" onClick={() => setClasse(outra)}>Ver {CLASSES.find((c) => c.id === outra)!.nome}</button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Como foi feito ---------- */
function ComoFoiFeito({ escolhida }: { escolhida: PessoaId | null }) {
  const [ref, visivel] = useVisivel<HTMLElement>();
  return (
    <section id="como" ref={ref} className={`bt-secao${visivel ? " is-visivel" : ""}`} aria-labelledby="bt-como">
      <h2 id="bt-como">Como foi feito</h2>
      <p className="bt-secao-texto">Cada marco tem a data do primeiro commit daquela parte.{escolhida ? ` Destacando ${pessoa(escolhida).nome}.` : ""}</p>
      <ol className="bt-linha">
        {LINHA_DO_TEMPO.map((m, i) => {
          const data = new Date(`${m.data}T12:00:00`);
          const apagado = escolhida !== null && !m.quem.includes(escolhida);
          return (
            <li key={m.data + m.titulo} className={apagado ? "is-apagado" : undefined} style={{ "--i": i } as React.CSSProperties}>
              <time dateTime={m.data}>{data.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}</time>
              <div>
                <strong>{m.titulo}</strong>
                <p>{m.texto}</p>
                <span className="bt-linha-quem">
                  {m.quem.map((q) => <i key={q} title={pessoa(q).nome} style={{ background: pessoa(q).cor }}>{pessoa(q).nome.charAt(0)}</i>)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
