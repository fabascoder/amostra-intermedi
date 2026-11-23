// Boas-vindas da amostra grátis: três passos antes da Central.
//  1. Marca do Intermedi (com "auvox" pequeno embaixo) e as boas-vindas.
//  2. O tempo de acesso, em minutos (a sessão começa só no passo 3).
//  3. O nome da pessoa, usado nas três experiências: gerente da farmácia
//     solicitante, gerente da fornecedora e paciente no aplicativo.
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import logo from "../assets/brand/logo-intermedi.webp";
import { definirNome, limparNome } from "../demoServices/patientService";
import { sessionDurationMs } from "../config/demo";
import { iniciarSessao, verificarSessao } from "../session/session";
import { AssinaturaAuvox } from "../shared/AssinaturaAuvox";
import { VideoPlataforma } from "../shared/VideoPlataforma";
import "./boasVindasDemo.css";

type Passo = 0 | 1 | 2;

export function BoasVindasDemo({ jaIniciada, onConcluir }: { jaIniciada: boolean; onConcluir: () => void }) {
  const uid = useId();
  // Sessão já ativa sem nome (quem entrou antes desta tela existir): só pede o nome.
  const [passo, setPasso] = useState<Passo>(jaIniciada ? 2 : 0);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [saindo, setSaindo] = useState(false);
  const campoRef = useRef<HTMLInputElement>(null);
  const minutos = Math.round(sessionDurationMs() / 60000);

  useEffect(() => {
    if (passo === 2) {
      const t = window.setTimeout(() => campoRef.current?.focus({ preventScroll: true }), 450);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [passo]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const limpo = limparNome(nome);
    if (limpo.length < 2) {
      setErro("Digite seu primeiro nome, com pelo menos 2 letras.");
      return;
    }
    if (!jaIniciada || !verificarSessao()) iniciarSessao();
    if (!definirNome(limpo)) {
      setErro("Não foi possível começar agora. Recarregue a página e tente de novo.");
      return;
    }
    setSaindo(true);
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(onConcluir, reduzir ? 0 : 650);
  }

  return (
    <div className={`bvd${saindo ? " is-saindo" : ""}`} role="dialog" aria-modal="true" aria-labelledby={`${uid}-titulo-${passo}`}>
      <div className="bvd-fundo" aria-hidden="true">
        <span className="bvd-orbe um" />
        <span className="bvd-orbe dois" />
        <span className="bvd-grade" />
      </div>

      <div className="bvd-meio">
      <div className="bvd-palco">
        {passo === 0 && (
          <section key="p0" className="bvd-passo bvd-passo-marca">
            <div className="bvd-marca">
              <img src={logo} alt="Intermedi" width="1920" height="1080" />
            </div>
            <span className="bvd-beta">Amostra · Versão beta</span>
            <h1 id={`${uid}-titulo-0`} className="bvd-titulo">
              <span>Boas-vindas à</span> <span>amostra grátis</span>
            </h1>
            <p className="bvd-texto">
              Esta é só uma parte do Intermedi, em versão beta. A plataforma completa tem muito mais funcionalidades.
            </p>
            <div className="bvd-acoes">
              <button type="button" className="bvd-botao" onClick={() => setPasso(1)}>
                Continuar <Seta />
              </button>
              <VideoPlataforma />
            </div>
          </section>
        )}

        {passo === 1 && (
          <section key="p1" className="bvd-passo">
            <Relogio minutos={minutos} />
            <h1 id={`${uid}-titulo-1`} className="bvd-titulo">
              Seu tempo é de <strong>{minutos} minutos</strong>
            </h1>
            <p className="bvd-texto">O tempo começa quando você entrar. Os dados são fictícios e nada altera informações reais.</p>
            <button type="button" className="bvd-botao" onClick={() => setPasso(2)}>
              Continuar <Seta />
            </button>
          </section>
        )}

        {passo === 2 && (
          <section key="p2" className="bvd-passo">
            <form className="bvd-form" onSubmit={enviar} noValidate>
              <label id={`${uid}-titulo-2`} htmlFor={`${uid}-nome`} className="bvd-titulo">
                Como podemos te chamar?
              </label>
              <p className="bvd-texto">Seu nome aparece na farmácia que pede, na que atende e no aplicativo.</p>
              <div className={`bvd-campo${erro ? " is-erro" : ""}`}>
                <input
                  ref={campoRef}
                  id={`${uid}-nome`}
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    setErro("");
                  }}
                  placeholder="Seu primeiro nome"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  maxLength={40}
                  enterKeyHint="go"
                  aria-invalid={Boolean(erro)}
                  aria-describedby={erro ? `${uid}-erro` : undefined}
                />
                <button type="submit" className="bvd-botao" disabled={saindo}>
                  Começar <Seta />
                </button>
              </div>
              {erro && <p id={`${uid}-erro`} className="bvd-erro" role="alert">{erro}</p>}
            </form>
          </section>
        )}
      </div>

      {!jaIniciada && (
        <div className="bvd-pontos" aria-label={`Passo ${passo + 1} de 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i === passo ? "is-atual" : i < passo ? "is-feito" : undefined} />
          ))}
        </div>
      )}
      </div>

      <AssinaturaAuvox className="bvd-assinatura" />
    </div>
  );
}

function Seta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

/** Anel que se completa enquanto o número sobe até o total de minutos. */
function Relogio({ minutos }: { minutos: number }) {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValor(minutos);
      return undefined;
    }
    let quadro = 0;
    const inicio = performance.now();
    const duracao = 1400;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio - 250) / duracao);
      const suave = t <= 0 ? 0 : 1 - Math.pow(1 - t, 3);
      setValor(Math.round(minutos * suave));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [minutos]);
  return (
    <div className="bvd-relogio" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <circle className="bvd-relogio-trilho" cx="60" cy="60" r="52" />
        <circle className="bvd-relogio-arco" cx="60" cy="60" r="52" pathLength={100} />
      </svg>
      <span className="bvd-relogio-numero">
        {valor}
        <small>min</small>
      </span>
    </div>
  );
}
