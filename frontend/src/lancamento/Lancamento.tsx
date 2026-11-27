// Camada de lançamento: contagem e abertura por cima da plataforma. Só é
// baixada por quem precisa dela (antes do lançamento, ou na primeira visita
// depois dele); quem já viu a abertura entra direto e nunca carrega este pedaço.
import { useCallback, useEffect, useRef, useState } from "react";
import logoCor from "../assets/brand/logo-intermedi.webp";
import marcaClara from "../assets/brand/wordmark-light.png";
import logoAuvox from "../assets/brand/logo-auvox.png";
import type { Perfil } from "./Abertura";
import Contagem from "./Contagem";
import { ensaioAtual, marcarAberturaVista, momentoLancamento } from "./fase";
import { agora, sincronizarRelogio } from "./relogio";
import { criarSom, type Som } from "./som";
import "./lancamento.css";

// A abertura é um pedaço à parte, baixado durante a contagem. Fica guardada
// aqui para o zero trocar de tela no mesmo quadro, sem esperar nada.
type ModuloAbertura = typeof import("./Abertura");
let moduloAbertura: ModuloAbertura | null = null;
const carregarAbertura = () => import("./Abertura").then((m) => (moduloAbertura = m));

/** Tudo o que o instante do lançamento usa, baixado e decodificado antes dele. */
function precarregar() {
  carregarAbertura().catch(() => {
    /* tenta de novo no zero; sem ela, o zero leva direto à plataforma */
  });
  for (const src of [logoCor, marcaClara, logoAuvox]) {
    const img = new Image();
    img.src = src;
    img.decode?.().catch(() => {});
  }
  void document.fonts?.load(`200 100px "Inter Variable"`).catch(() => {});
}

/** Aparelho modesto ou econômico de dados: abertura no perfil leve. */
function perfilInicial(): Perfil {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (nav.deviceMemory ?? 8) <= 2 || nav.connection?.saveData ? "leve" : "pleno";
}

/** Mede o ritmo de quadros durante a contagem: abaixo de ~45 qps, perfil leve. */
function medirQuadros(aoMedir: (lento: boolean) => void): () => void {
  let quadro = 0;
  const tempos: number[] = [];
  let ultimo = 0;
  const passo = (t: number) => {
    if (ultimo) tempos.push(t - ultimo);
    ultimo = t;
    if (tempos.length < 90) quadro = requestAnimationFrame(passo);
    else {
      const ordenados = [...tempos].sort((a, b) => a - b);
      aoMedir(ordenados[Math.floor(ordenados.length / 2)] > 22);
    }
  };
  quadro = requestAnimationFrame(passo);
  return () => cancelAnimationFrame(quadro);
}

function prefereMenosMovimento(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = {
  inicio: "contagem" | "abertura";
  onMontarDemo: () => void;
  onConcluir: () => void;
};

export default function Lancamento({ inicio, onMontarDemo, onConcluir }: Props) {
  const lancamentoMs = momentoLancamento() ?? 0;
  const ensaio = ensaioAtual();
  const [etapa, setEtapa] = useState(inicio);
  const [doZero, setDoZero] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial);
  const [reduzir] = useState(prefereMenosMovimento);
  const somRef = useRef<Som | null>(null);
  const [somAtivo, setSomAtivo] = useState(false);
  const [semAbertura, setSemAbertura] = useState(false);
  const [modulo, setModulo] = useState(() => moduloAbertura);

  // palco verde em toda a página (inclusive o "elástico" do iOS e a barra do navegador)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("lc-ativo");
    const meta = document.querySelector('meta[name="theme-color"]');
    const cor = meta?.getAttribute("content");
    meta?.setAttribute("content", "#0E6B50");
    return () => {
      html.classList.remove("lc-ativo");
      if (meta && cor) meta.setAttribute("content", cor);
      const som = somRef.current;
      // deixa os últimos ecos soarem antes de fechar o áudio
      if (som) window.setTimeout(() => som.fechar(), 4000);
    };
  }, []);

  useEffect(() => {
    const ocioso = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 250));
    ocioso(() => {
      precarregar();
      carregarAbertura().then(setModulo, () => {});
    });
    let parar = () => {};
    const medir = window.setTimeout(() => {
      parar = medirQuadros((lento) => lento && setPerfil("leve"));
    }, 1800);
    if (!ensaio) {
      void sincronizarRelogio().then(() => {
        // relógio do aparelho adiantado: ainda não chegou a hora
        if (agora() < lancamentoMs) setEtapa("contagem");
      });
    }
    return () => {
      window.clearTimeout(medir);
      parar();
    };
  }, [ensaio, lancamentoMs]);

  const aoZerar = useCallback(() => {
    setDoZero(true);
    setEtapa("abertura");
  }, []);

  // na abertura sem o pedaço carregado: espera por ele com o "0" na tela; se
  // não vier (a rede caiu), leva direto à plataforma
  useEffect(() => {
    if (etapa !== "abertura" || modulo) return;
    carregarAbertura().then(setModulo, () => setSemAbertura(true));
  }, [etapa, modulo]);

  const aoTerminar = useCallback(() => {
    marcarAberturaVista();
    onConcluir();
  }, [onConcluir]);

  useEffect(() => {
    if (!semAbertura) return;
    onMontarDemo();
    onConcluir();
  }, [semAbertura, onMontarDemo, onConcluir]);

  const alternarSom = useCallback(() => {
    if (somRef.current) {
      somRef.current.fechar();
      somRef.current = null;
      setSomAtivo(false);
      return;
    }
    const som = criarSom();
    if (!som) return;
    som.confirmar();
    somRef.current = som;
    setSomAtivo(true);
  }, []);

  if (etapa === "contagem") {
    return <Contagem lancamentoMs={lancamentoMs} onZero={aoZerar} somAtivo={somAtivo} onAlternarSom={alternarSom} />;
  }
  if (!modulo) return <EsperaZero zero={doZero} />;
  const Abertura = modulo.default;
  return (
    <Abertura
      doZero={doZero}
      reduzir={reduzir}
      perfil={ensaio?.perfil ?? perfil}
      som={somRef.current}
      quadro={ensaio?.quadro ?? null}
      onMontarDemo={onMontarDemo}
      onTerminar={aoTerminar}
    />
  );
}

/** Enquanto a abertura carrega: o mesmo palco e o mesmo "0", sem nada que pisque. */
function EsperaZero({ zero }: { zero: boolean }) {
  return (
    <div className="lc-abertura">
      {zero && (
        <div className="lc-centro" aria-hidden="true">
          <span className="lc-numeral">0</span>
        </div>
      )}
    </div>
  );
}
