// Contagem regressiva até o lançamento. Os números são o protagonista: soltos,
// enormes e finos, cada dígito rolando quando muda. Nos últimos dez segundos,
// tudo recua e só os segundos ficam, grandes, no centro; o "0" final é o mesmo
// que a abertura recebe e transforma em ponto.
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import marcaClara from "../assets/brand/wordmark-light.png";
import { FUSO, TEXTOS } from "./config";
import { agora } from "./relogio";

type Partes = { dias: number; horas: number; minutos: number; segundos: number; total: number };

function partes(restanteMs: number): Partes {
  const total = Math.max(0, Math.ceil(restanteMs / 1000));
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
    total,
  };
}

/** "Terça-feira, 1º de dezembro" e "0h" / "19h30", no horário de Brasília. */
export function descreverData(ms: number) {
  const data = new Date(ms);
  const pedaco = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...o }).format(data);
  const dia = Number(pedaco({ day: "numeric" }));
  const semana = pedaco({ weekday: "long" });
  const [h, m] = pedaco({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).split(":").map(Number);
  return {
    dia: `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${dia === 1 ? "1º" : dia} de ${pedaco({ month: "long" })}`,
    hora: m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`,
  };
}

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

/** Um dígito numa janela: o novo entra por baixo enquanto o antigo sai por cima. */
function Digito({ d, ordem }: { d: string; ordem: number }) {
  const [estado, setEstado] = useState({ atual: d, anterior: null as string | null, n: 0 });
  if (estado.atual !== d) setEstado({ atual: d, anterior: estado.atual, n: estado.n + 1 });
  return (
    <span className="lc-digito" style={{ "--ordem": ordem } as CSSProperties}>
      <span key={`e${estado.n}`} className={estado.n ? "lc-d-entra" : "lc-d-chega"}>{estado.atual}</span>
      {estado.anterior !== null && <span key={`s${estado.n}`} className="lc-d-sai">{estado.anterior}</span>}
    </span>
  );
}

/** Número da reta final: cada segundo novo assenta por cima do anterior. */
function NumeroFinal({ n }: { n: number }) {
  const [estado, setEstado] = useState({ atual: n, anterior: null as number | null });
  if (estado.atual !== n) setEstado({ atual: n, anterior: estado.atual });
  return (
    <div className="lc-centro lc-final" aria-hidden="true">
      {estado.anterior !== null && <span key={`s${estado.anterior}`} className="lc-numeral lc-f-sai">{estado.anterior}</span>}
      <span key={`e${estado.atual}`} className="lc-numeral lc-f-entra">{estado.atual}</span>
    </div>
  );
}

type Props = {
  lancamentoMs: number;
  onZero: () => void;
  somAtivo: boolean;
  onAlternarSom: () => void;
};

export default function Contagem({ lancamentoMs, onZero, somAtivo, onAlternarSom }: Props) {
  const [instante, setInstante] = useState(agora);
  const restante = lancamentoMs - instante;
  const p = partes(restante);
  const final = p.total <= 10;
  const quando = useMemo(() => descreverData(lancamentoMs), [lancamentoMs]);

  useEffect(() => {
    document.title = "Lançamento | Intermedi Demo";
    return () => {
      document.title = "Intermedi Demo";
    };
  }, []);

  // Um tique a cada virada de segundo da contagem (não do relógio), para o
  // número mudar no instante certo mesmo num ensaio que começou no meio de um
  // segundo. Ao voltar para a aba, corrige na hora.
  useEffect(() => {
    let t = 0;
    const tique = () => {
      const ms = agora();
      setInstante(ms);
      const r = lancamentoMs - ms;
      if (r <= 0) return;
      t = window.setTimeout(tique, (r % 1000 || 1000) + 6);
    };
    tique();
    const aoVoltar = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(t);
      tique();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [lancamentoMs]);

  // no zero, o "0" entra como os outros segundos e assenta; só então a abertura
  // assume, com o mesmo "0" no mesmo lugar
  const zerou = restante <= 0;
  useEffect(() => {
    if (!zerou) return undefined;
    const t = window.setTimeout(onZero, final ? 900 : 0);
    return () => window.clearTimeout(t);
  }, [zerou]); // eslint-disable-line react-hooks/exhaustive-deps

  const grupos = [
    { valor: p.dias, rotulo: plural(p.dias, "dia", "dias"), casas: p.dias > 99 ? 3 : 2 },
    { valor: p.horas, rotulo: plural(p.horas, "hora", "horas"), casas: 2 },
    { valor: p.minutos, rotulo: plural(p.minutos, "minuto", "minutos"), casas: 2 },
    { valor: p.segundos, rotulo: plural(p.segundos, "segundo", "segundos"), casas: 2 },
  ];
  // leitores de tela: uma frase que muda por minuto, não a cada segundo
  const frase = `Faltam ${p.dias} ${plural(p.dias, "dia", "dias")}, ${p.horas} ${plural(p.horas, "hora", "horas")} e ${p.minutos} ${plural(p.minutos, "minuto", "minutos")} para o lançamento do Intermedi.`;
  let ordem = 0;

  return (
    <main className={`lc-contagem${final ? " is-final" : ""}`} id="conteudo">
      <header className="lc-topo">
        <img className="lc-marca" src={marcaClara} alt="Intermedi" width="581" height="370" />
        <button type="button" className="lc-som" aria-pressed={somAtivo} onClick={onAlternarSom}>
          <SomIcone ativo={somAtivo} />
          {somAtivo ? "Som da abertura ligado" : "Ligar som da abertura"}
        </button>
      </header>

      <div className="lc-relogio" role="timer" aria-label={frase}>
        {grupos.map((g) => (
          <div className="lc-grupo" key={g.rotulo.slice(0, 3)}>
            <span className="lc-num" aria-hidden="true">
              {[...String(g.valor).padStart(g.casas, "0")].map((d, i) => (
                <Digito key={i} d={d} ordem={ordem++} />
              ))}
            </span>
            <span className="lc-unidade">{g.rotulo}</span>
          </div>
        ))}
      </div>

      <footer className="lc-pe">
        <p className="lc-chamada">
          <span>{TEXTOS.chamada}</span>
          <span>{TEXTOS.apoio}</span>
        </p>
        <p className="lc-data">
          <span>{quando.dia}</span>
          <span>{quando.hora}, horário de Brasília</span>
        </p>
      </footer>

      {final && <NumeroFinal n={p.total} />}
    </main>
  );
}

function SomIcone({ ativo }: { ativo: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" stroke="none" />
      {ativo ? (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      ) : (
        <path d="m16 9.5 5 5m0-5-5 5" />
      )}
    </svg>
  );
}
