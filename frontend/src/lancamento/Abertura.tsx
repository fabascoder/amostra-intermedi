// Abertura do lançamento (cerca de 15 s). Uma única linha atravessa o filme
// inteiro, sem cortes:
//
//   zero ..... o "0" da contagem se condensa num ponto            (0–2,4 s)
//   frase .... o ponto corre e vira linha; a frase nasce dela e a
//              linha se recolhe sob "conexão."                     (2,4–5,7 s)
//   rede ..... a linha se desdobra em rede: farmácias ligadas, com
//              remédios passando de uma a outra                    (5,7–9,4 s)
//   marca .... a rede se recolhe e vira a cruz do logotipo; a
//              palavra sobe por dentro dela e a cápsula assenta    (9,4–12,9 s)
//   luz ...... a luz se abre a partir da cruz, a logo pousa onde fica
//              na tela de boas-vindas e a plataforma se monta em volta
//
// GSAP conduz uma linha do tempo só; a cena é SVG + HTML e só anima
// transform, opacidade e atributos do SVG. Perfil "leve" (aparelhos fracos)
// tira o brilho, a rotação e a máscara circular; quem pede menos movimento
// vê só a marca e um esmaecer.
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import "@fontsource/poppins/latin-700.css";
import logoCor from "../assets/brand/logo-intermedi.webp";
import { CONSTELACAO, CORDAS, LOGO_COR, MARCA, PULSOS, caminho, mapaDaMarca, type Ponto } from "./cena";
import { TEXTOS } from "./config";
import type { Som } from "./som";

// a Poppins da palavra precisa estar pronta antes de a marca aparecer
if (typeof document !== "undefined") void document.fonts?.load(`700 100px Poppins`).catch(() => {});

export type Perfil = "pleno" | "leve";

type Props = {
  /** veio da contagem (o "0" já está na tela) ou abre direto */
  doZero: boolean;
  reduzir: boolean;
  perfil: Perfil;
  som: Som | null;
  /** ensaio: para a abertura neste segundo */
  quadro: number | null;
  onMontarDemo: () => void;
  onTerminar: () => void;
};

type No = Ponto & { r: number };

const CAMPO = "#0E6B50";
const MENTA = "#8FE0B5";

/** Palavras viram janelas; letras sobem de dentro delas. */
function Palavras({ texto, classe, destaque }: { texto: string; classe: string; destaque?: string }) {
  return (
    <>
      {texto.split(" ").map((palavra, i, todas) => (
        <span key={i}>
          <span className={`lc-palavra${palavra === destaque ? " lc-destaque" : ""}`}>
            {classe === "letra"
              ? [...palavra].map((c, j) => (
                  <span key={j} className="lc-letra">
                    {c}
                  </span>
                ))
              : <span className="lc-letra">{palavra}</span>}
          </span>
          {i < todas.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export default function Abertura({ doZero, reduzir, perfil, som, quadro, onMontarDemo, onTerminar }: Props) {
  const [tela] = useState(() => ({ W: window.innerWidth, H: window.innerHeight }));
  const { W, H } = tela;
  const cx = W / 2;
  const cy = H / 2;
  const leve = perfil === "leve";

  // marca: grande no palco, sem passar da tela
  const largMarca = Math.min(W * 0.74, H * 0.46 * (MARCA.caixa.w / MARCA.caixa.h), 600);
  const m = mapaDaMarca(cx, cy, largMarca);
  // logo em cores com a tinta exatamente sobre a do vetor
  const ex = (MARCA.caixa.w * m.k) / LOGO_COR.caixa.w;
  const ey = (MARCA.caixa.h * m.k) / LOGO_COR.caixa.h;
  const logoRet = {
    left: m.x(MARCA.caixa.x) - LOGO_COR.caixa.x * ex,
    top: m.y(MARCA.caixa.y) - LOGO_COR.caixa.y * ey,
    width: LOGO_COR.w * ex,
    height: LOGO_COR.h * ey,
  };
  const centroCruz = { x: m.x(186.25), y: m.y(187.25) };

  const raiz = useRef<HTMLDivElement>(null);
  const terminou = useRef(false);
  const montou = useRef(false);
  const linhaDoTempo = useRef<gsap.core.Timeline | null>(null);

  const montarDemo = useCallback((continuar: boolean) => {
    if (montou.current) return;
    montou.current = true;
    const html = document.documentElement;
    if (continuar) html.classList.add("lc-continua");
    html.classList.add("lc-preparo");
    onMontarDemo();
  }, [onMontarDemo]);

  /** Fim: a logo pousa no lugar dela na tela de boas-vindas e a cena se desfaz. */
  const entregar = useCallback(async (comPouso: boolean) => {
    if (terminou.current) return;
    terminou.current = true;
    const el = raiz.current;
    if (!el) return onTerminar();
    const clara = el.querySelector<HTMLElement>(".lc-clara")!;
    const logo = el.querySelector<HTMLElement>(".lc-logo-cor")!;
    el.querySelector<HTMLElement>(".lc-escura")!.style.visibility = "hidden";
    el.style.background = "transparent";
    el.querySelector<HTMLElement>(".lc-pular")!.style.visibility = "hidden";
    montarDemo(comPouso);
    const html = document.documentElement;
    html.classList.remove("lc-ativo");

    // espera a tela de boas-vindas existir por baixo (no máximo meio segundo)
    let alvo: HTMLImageElement | null = null;
    for (let i = 0; i < 30 && !alvo; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      alvo = document.querySelector<HTMLImageElement>(".bvd-passo-marca .bvd-marca img");
    }
    if (alvo && comPouso) {
      const a = alvo.getBoundingClientRect();
      const s = logo.getBoundingClientRect();
      await gsap.to(logo, {
        x: a.left - s.left,
        y: a.top - s.top,
        scaleX: a.width / s.width,
        scaleY: a.height / s.height,
        transformOrigin: "0 0",
        duration: 0.85,
        ease: "power3.inOut",
      });
    }
    html.classList.remove("lc-preparo");
    gsap.to(clara, { backgroundColor: "rgba(245, 245, 247, 0)", duration: 0.45, ease: "power1.out" });
    if (alvo && comPouso) gsap.set(logo, { autoAlpha: 0, delay: 0.55 });
    else gsap.to(logo, { autoAlpha: 0, duration: 0.45 });
    window.setTimeout(onTerminar, 620);
  }, [montarDemo, onTerminar]);

  const pular = useCallback(() => {
    if (terminou.current) return;
    linhaDoTempo.current?.pause();
    som?.parar();
    const el = raiz.current;
    if (!el) return;
    const clara = el.querySelector<HTMLElement>(".lc-clara")!;
    gsap.set(el.querySelector(".lc-logo-cor"), { autoAlpha: 0 });
    gsap.set(clara, { clipPath: "none" });
    gsap.fromTo(clara, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out", onComplete: () => void entregar(false) });
  }, [entregar, som]);

  useLayoutEffect(() => {
    const el = raiz.current!;
    const sel = <T extends Element>(s: string) => el.querySelector<T>(s)!;
    const todos = <T extends Element>(s: string) => [...el.querySelectorAll<T>(s)];

    const traco = sel<SVGPathElement>(".lc-traco");
    const camera = sel<SVGGElement>(".lc-camera");
    const nosEl = todos<SVGCircleElement>(".lc-no");
    const cordasEl = todos<SVGLineElement>(".lc-corda");
    const pulsosEl = todos<SVGCircleElement>(".lc-pulso");
    const brilhosEl = todos<SVGCircleElement>(".lc-brilho");
    const pontoEl = sel<SVGCircleElement>(".lc-ponto");
    const haloEl = sel<SVGCircleElement>(".lc-halo");
    const zero = sel<HTMLElement>(".lc-zero");
    const frase = sel<HTMLElement>(".lc-frase");
    const letrasFrase = todos<HTMLElement>(".lc-frase .lc-letra");
    const destaque = sel<HTMLElement>(".lc-frase .lc-destaque");
    const palavrasBv = todos<HTMLElement>(".lc-bv .lc-letra");
    const letrasMarca = todos<SVGTextElement>(".lc-marca-letra");
    const capsula = sel<SVGGElement>(".lc-capsula");
    const pingo = sel<SVGCircleElement>(".lc-pingo");
    const clara = sel<HTMLElement>(".lc-clara");
    const botaoPular = sel<HTMLElement>(".lc-pular");

    // ---------- posições de cada etapa ----------
    const n = MARCA.cruz.length;
    const fr = frase.getBoundingClientRect();
    const dr = destaque.getBoundingClientRect();
    const corpoFrase = parseFloat(getComputedStyle(frase).fontSize) || 40;
    const meiaLinha = Math.min(W / 2 - 20, fr.width / 2 + corpoFrase * 0.5);
    // na linha, cada ponto fica na ordem horizontal que terá na rede: ao se
    // desdobrar, cada um sobe ou desce, sem cruzar com os outros
    const ordem = CONSTELACAO.map((c, i) => ({ i, u: c[0] })).sort((a, b) => a.u - b.u);
    const posNaLinha = new Array<number>(n);
    ordem.forEach((o, rank) => (posNaLinha[o.i] = rank / (n - 1)));
    const linha = posNaLinha.map((t) => ({ x: cx - meiaLinha + t * meiaLinha * 2, y: cy }));
    const sublinha = posNaLinha.map((t) => ({ x: dr.left + t * dr.width, y: cy }));
    const ax = Math.min(W * 0.4, 560);
    const ay = Math.min(H * 0.32, 300);
    const constelacao = CONSTELACAO.map(([u, v]) => ({ x: cx + u * ax, y: cy + v * ay }));
    const cruz = MARCA.cruz.map(([u, v]) => ({ x: m.x(u), y: m.y(v) }));
    const tracoMarca = MARCA.traco * m.k;

    // ---------- estado desenhado a cada quadro ----------
    const E = {
      nos: Array.from({ length: n }, () => ({ x: cx, y: cy, r: 0 })) as No[],
      lw: 0,
      arred: 0,
      ponto: { r: 0 },
      halo: { r: 0, a: 0 },
      cordas: CORDAS.map(() => ({ p: 0 })),
      pulsos: PULSOS.map(() => ({ t: 0, a: 0 })),
      cam: { s: 1, rot: 0 },
    };
    const raios = MARCA.raios.map((r) => r * m.k);

    const desenhar = () => {
      traco.setAttribute("d", caminho(E.nos, raios.map((r) => r * E.arred)));
      traco.setAttribute("stroke-width", String(E.lw));
      E.nos.forEach((no, i) => {
        nosEl[i].setAttribute("cx", String(no.x));
        nosEl[i].setAttribute("cy", String(no.y));
        nosEl[i].setAttribute("r", String(no.r));
      });
      CORDAS.forEach(([a, b], i) => {
        const A = E.nos[a];
        const B = E.nos[b];
        const p = E.cordas[i].p;
        cordasEl[i].setAttribute("x1", String(A.x));
        cordasEl[i].setAttribute("y1", String(A.y));
        cordasEl[i].setAttribute("x2", String(A.x + (B.x - A.x) * p));
        cordasEl[i].setAttribute("y2", String(A.y + (B.y - A.y) * p));
        cordasEl[i].style.opacity = p > 0.001 ? "1" : "0";
      });
      PULSOS.forEach(({ de, para }, i) => {
        const A = E.nos[de];
        const B = E.nos[para];
        const { t, a } = E.pulsos[i];
        const x = String(A.x + (B.x - A.x) * t);
        const y = String(A.y + (B.y - A.y) * t);
        pulsosEl[i].setAttribute("cx", x);
        pulsosEl[i].setAttribute("cy", y);
        pulsosEl[i].style.opacity = String(a);
        if (brilhosEl[i]) {
          brilhosEl[i].setAttribute("cx", x);
          brilhosEl[i].setAttribute("cy", y);
          brilhosEl[i].style.opacity = String(a * 0.35);
        }
      });
      pontoEl.setAttribute("r", String(E.ponto.r));
      haloEl.setAttribute("r", String(E.halo.r));
      haloEl.style.opacity = String(E.halo.a);
      camera.setAttribute("transform", `translate(${cx} ${cy}) rotate(${E.cam.rot}) scale(${E.cam.s}) translate(${-cx} ${-cy})`);
    };

    const ctx = gsap.context(() => {
      gsap.set(letrasFrase, { yPercent: 115 });
      gsap.set(palavrasBv, { yPercent: 115 });
      gsap.set(letrasMarca, { y: 125 });
      gsap.set(capsula, { y: -210, rotation: 24, svgOrigin: "556 195", autoAlpha: 0 });
      gsap.set(pingo, { y: -160, autoAlpha: 0 });
      gsap.set(botaoPular, { autoAlpha: 0 });
      if (leve) gsap.set(clara, { autoAlpha: 0 });
      else gsap.set(clara, { clipPath: `circle(0px at ${centroCruz.x}px ${centroCruz.y}px)` });

      const tl = gsap.timeline({ paused: true, onUpdate: desenhar });
      linhaDoTempo.current = tl;

      if (reduzir) {
        // menos movimento: a marca já montada, um esmaecer e a plataforma
        E.nos.forEach((no, i) => Object.assign(no, cruz[i], { r: 0 }));
        E.lw = tracoMarca;
        E.arred = 1;
        gsap.set([letrasMarca, capsula, pingo], { y: 0, rotation: 0, autoAlpha: 1 });
        gsap.set(palavrasBv, { yPercent: 0 });
        gsap.set(zero, { autoAlpha: 0 });
        gsap.set(clara, { clipPath: "none", autoAlpha: 0 });
        tl.fromTo([sel(".lc-cena"), sel(".lc-bv")], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0)
          .to(botaoPular, { autoAlpha: 1, duration: 0.3 }, 0.3)
          .to(clara, { autoAlpha: 1, duration: 0.6 }, 2.7)
          .call(() => void entregar(false), [], 3.4);
        desenhar();
        if (quadro !== null) tl.seek(quadro).pause();
        else tl.play();
        return;
      }

      // ---------- zero ----------
      const z = doZero ? 0 : 0.7;
      if (!doZero) tl.fromTo(zero, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power2.out" }, 0);
      tl.to(zero, { scale: 1.045, duration: 0.45, ease: "power2.out" }, z)
        .to(zero, { scale: 0.018, ...(leve ? {} : { fontWeight: 860 }), duration: 0.8, ease: "expo.in" }, z + 0.45)
        .to(zero, { autoAlpha: 0, duration: 0.1, ease: "none" }, z + 1.17)
        .to(E.ponto, { r: 5.5, duration: 0.35, ease: "back.out(3)" }, z + 1.15)
        .set(E.halo, { r: 6, a: 0.5 }, z + 1.3)
        .to(E.halo, { r: Math.min(W, H) * 0.16, a: 0, duration: 1.5, ease: "expo.out" }, z + 1.3)
        .call(() => som?.impacto(), [], z + 1.17)
        .call(() => som?.fundo(), [], z + 1.45)
        .to(botaoPular, { autoAlpha: 1, duration: 0.5 }, z + 0.8);

      // ---------- frase ----------
      const L = z + 2.4;
      tl.to(E.ponto, { r: 0, duration: 0.35, ease: "power2.in" }, L)
        .to(E, { lw: 2, duration: 0.25, ease: "none" }, L)
        .to(E.nos, { x: (i: number) => linha[i].x, y: cy, duration: 1.05, ease: "expo.inOut" }, L)
        .call(() => som?.sopro(), [], L)
        .to(letrasFrase, { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.02 }, L + 0.55)
        // a linha se recolhe sob a última palavra
        .to(E.nos, { x: (i: number) => sublinha[i].x, duration: 0.75, ease: "expo.inOut" }, L + 2.2);

      // ---------- rede ----------
      const R = L + 3.3;
      tl.to(letrasFrase, { yPercent: -115, duration: 0.55, ease: "power3.in", stagger: 0.008 }, R)
        .to(E.nos, { x: (i: number) => constelacao[i].x, y: (i: number) => constelacao[i].y, duration: 1.8, ease: "power3.inOut" }, R + 0.15)
        .to(E.nos, { r: 4, duration: 0.5, ease: "back.out(2)", stagger: 0.04 }, R + 0.4)
        .to(E.cam, { s: 1.07, rot: leve ? 0 : -1.6, duration: 3.9, ease: "sine.inOut" }, R)
        .to(E.cordas, { p: 1, duration: 0.7, ease: "power2.inOut", stagger: 0.11 }, R + 1.35);
      const pulsos = leve ? PULSOS.slice(0, 3) : PULSOS;
      pulsos.forEach((pulso, j) => {
        const t0 = R + 1.9 + j * 0.27;
        tl.fromTo(E.pulsos[j], { t: 0 }, { t: 1, duration: 0.8, ease: "power1.inOut" }, t0)
          .to(E.pulsos[j], { a: 1, duration: 0.12, ease: "none" }, t0)
          .to(E.pulsos[j], { a: 0, duration: 0.2, ease: "none" }, t0 + 0.62)
          .call(() => som?.nota(pulso.nota), [], t0);
      });

      // ---------- marca ----------
      const M = R + 3.7;
      tl.to(E.cordas, { p: 0, duration: 0.45, ease: "power2.in", stagger: 0.03 }, M)
        .to(E.nos, { x: (i: number) => cruz[i].x, y: (i: number) => cruz[i].y, duration: 1.3, ease: "expo.inOut" }, M + 0.1)
        .to(E.cam, { s: 1, rot: 0, duration: 1.3, ease: "expo.inOut" }, M + 0.1)
        .to(E.nos, { r: 0, duration: 0.3, ease: "power2.in" }, M + 1.15)
        .to(E, { lw: tracoMarca, arred: 1, duration: 0.6, ease: "power3.out" }, M + 1.25)
        .call(() => som?.acorde(), [], M + 1.25)
        .to(letrasMarca, { y: 0, duration: 0.8, ease: "expo.out", stagger: 0.045 }, M + 1.5)
        .set(capsula, { autoAlpha: 1 }, M + 2.1)
        .to(capsula, { y: 0, rotation: 0, duration: 0.7, ease: "back.out(1.5)" }, M + 2.1)
        .set(pingo, { autoAlpha: 1 }, M + 2.28)
        .to(pingo, { y: 0, duration: 0.6, ease: "back.out(2.2)" }, M + 2.28)
        .call(() => som?.toque(), [], M + 2.55)
        .to(palavrasBv, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, M + 2.75);

      // ---------- luz ----------
      const LZ = M + 3.5;
      const raioLuz = Math.hypot(Math.max(centroCruz.x, W - centroCruz.x), Math.max(centroCruz.y, H - centroCruz.y)) + 4;
      tl.call(() => som?.luz(), [], LZ)
        .to(botaoPular, { autoAlpha: 0, duration: 0.3 }, LZ)
        .to(clara, leve ? { autoAlpha: 1, duration: 0.8, ease: "power1.inOut" } : { clipPath: `circle(${raioLuz}px at ${centroCruz.x}px ${centroCruz.y}px)`, duration: 1.0, ease: "power3.inOut" }, LZ)
        .call(() => montarDemo(true), [], LZ + 0.15)
        .call(() => void entregar(true), [], LZ + 1.02);

      desenhar();
      if (quadro !== null) {
        tl.seek(quadro, true).pause();
        desenhar();
      } else tl.play();
    }, el);

    return () => {
      ctx.revert();
      linhaDoTempo.current = null;
    };
    // a cena é montada uma vez, com o tamanho da tela de quando começou
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc pula a abertura
  useLayoutEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") pular();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [pular]);

  return (
    <div className={`lc-abertura${leve ? " is-leve" : ""}`} ref={raiz} style={{ background: CAMPO }}>
      <div className="lc-escura">
        <svg className="lc-cena" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <g className="lc-camera">
            {CORDAS.map((_, i) => (
              <line key={i} className="lc-corda" stroke="#fff" strokeOpacity="0.32" strokeWidth="1.2" />
            ))}
            <path className="lc-traco" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
            {MARCA.cruz.map((_, i) => (
              <circle key={i} className="lc-no" fill="#fff" r="0" />
            ))}
            {!leve && PULSOS.map((_, i) => <circle key={i} className="lc-brilho" fill={MENTA} r="9" style={{ opacity: 0 }} />)}
            {PULSOS.map((_, i) => (
              <circle key={i} className="lc-pulso" fill={MENTA} r="3.4" style={{ opacity: 0 }} />
            ))}
            <circle className="lc-halo" cx={cx} cy={cy} r="0" fill="none" stroke="#fff" strokeWidth="1" />
            <circle className="lc-ponto" cx={cx} cy={cy} r="0" fill="#fff" />
          </g>
          <g transform={`translate(${m.ox} ${m.oy}) scale(${m.k})`}>
            <clipPath id="lc-corte-palavra">
              <rect x="0" y="-200" width="600" height={MARCA.linhaBase + 202} />
            </clipPath>
            <g clipPath="url(#lc-corte-palavra)">
              {MARCA.letras.map(([letra, x], i) => (
                <text key={i} className="lc-marca-letra" x={x} y={MARCA.linhaBase} fontFamily="Poppins" fontWeight="700" fontSize={MARCA.corpo} fill="#fff">
                  {letra}
                </text>
              ))}
            </g>
            <g className="lc-capsula">
              <rect x={MARCA.capsula.x} y={MARCA.capsula.y} width={MARCA.capsula.w} height={MARCA.capsula.h} rx={MARCA.capsula.r} fill="none" stroke="#fff" strokeWidth={MARCA.capsula.traco} />
              <path d={MARCA.capsulaCheia} fill="#fff" />
            </g>
            <circle className="lc-pingo" cx={MARCA.pingo.cx} cy={MARCA.pingo.cy} r={MARCA.pingo.r} fill="#fff" />
          </g>
        </svg>

        <div className="lc-centro" aria-hidden="true">
          <span className="lc-numeral lc-zero" style={{ opacity: doZero ? 1 : 0 }}>
            0
          </span>
        </div>
        <p className="lc-frase" aria-label={TEXTOS.frase}>
          <span aria-hidden="true">
            <Palavras texto={TEXTOS.frase} classe="letra" destaque={TEXTOS.destaque} />
          </span>
        </p>
        <p className="lc-bv" aria-label={TEXTOS.boasVindas} style={{ top: m.y(MARCA.caixa.y + MARCA.caixa.h) + Math.max(28, H * 0.045) }}>
          <span aria-hidden="true">
            <Palavras texto={TEXTOS.boasVindas} classe="palavra" />
          </span>
        </p>
      </div>

      <div className="lc-clara">
        <img className="lc-logo-cor" src={logoCor} alt="" style={logoRet} />
      </div>

      <button type="button" className="lc-pular" onClick={pular}>
        Pular abertura
      </button>
    </div>
  );
}
