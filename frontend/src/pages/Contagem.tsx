// Contagem regressiva até o lançamento (session/lancamento.ts). Fica no lugar
// de todo o app até a hora marcada; quando chega a zero, mostra "Chegou a
// hora!" por um instante e abre a amostra sozinha.
import { useEffect, useState } from "react";
import logo from "../assets/brand/logo-intermedi.webp";
import { AUVOX } from "../config/demo";
import { AssinaturaAuvox } from "../shared/AssinaturaAuvox";
import { VideoPlataforma } from "../shared/VideoPlataforma";
import "./contagem.css";

const FUSO = "America/Sao_Paulo";
/** Quanto tempo o "Chegou a hora!" fica na tela antes de abrir a amostra. */
const VIRADA_MS = 1800;

type Partes = { dias: number; horas: number; minutos: number; segundos: number };

function partes(restanteMs: number): Partes {
  const total = Math.max(0, Math.ceil(restanteMs / 1000));
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  };
}

/** "terça-feira, 1º de dezembro", "terça" e "a partir da 0h" / "a partir das 19h30", no horário de Brasília. */
function descreverData(ms: number) {
  const data = new Date(ms);
  const pedaco = (opcoes: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...opcoes }).format(data);
  const dia = Number(pedaco({ day: "numeric" }));
  const semana = pedaco({ weekday: "long" });
  const mes = pedaco({ month: "long" });
  const [h, m] = pedaco({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).split(":").map(Number);
  const hora = m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
  return {
    dia: `${semana}, ${dia === 1 ? "1º" : dia} de ${mes}`,
    semana: semana.replace("-feira", ""),
    horario: h === 0 && m === 0 ? "a partir da 0h" : h === 1 ? `a partir da ${hora}` : `a partir das ${hora}`,
  };
}

const doisDigitos = (n: number) => String(n).padStart(2, "0");
const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

export default function Contagem({ lancamentoMs, onLancar }: { lancamentoMs: number; onLancar: () => void }) {
  const [agora, setAgora] = useState(() => Date.now());
  const restante = lancamentoMs - agora;
  const chegou = restante <= 0;
  const { dias, horas, minutos, segundos } = partes(restante);
  const quando = descreverData(lancamentoMs);

  useEffect(() => {
    document.title = "Lançamento em breve | Intermedi Demo";
    return () => {
      document.title = "Intermedi Demo";
    };
  }, []);

  // Um tique por segundo, alinhado à virada do segundo; ao voltar para a aba,
  // o relógio corrige na hora (abas em segundo plano atrasam os timers).
  useEffect(() => {
    if (chegou) return undefined;
    let t = 0;
    const tique = () => {
      const ms = Date.now();
      setAgora(ms);
      t = window.setTimeout(tique, 1000 - (ms % 1000) + 5);
    };
    t = window.setTimeout(tique, 1000 - (Date.now() % 1000) + 5);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") setAgora(Date.now());
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [chegou]);

  useEffect(() => {
    if (!chegou) return undefined;
    const t = window.setTimeout(onLancar, VIRADA_MS);
    return () => window.clearTimeout(t);
  }, [chegou, onLancar]);

  const blocos: { valor: number; rotulo: string }[] = [
    { valor: dias, rotulo: plural(dias, "dia", "dias") },
    { valor: horas, rotulo: plural(horas, "hora", "horas") },
    { valor: minutos, rotulo: plural(minutos, "minuto", "minutos") },
    { valor: segundos, rotulo: plural(segundos, "segundo", "segundos") },
  ];
  const instagram = AUVOX.instagram.replace(/^@/, "");

  return (
    <main className={`ctg${chegou ? " is-chegou" : ""}`} id="conteudo">
      <div className="ctg-fundo" aria-hidden="true">
        <span className="ctg-orbe um" />
        <span className="ctg-orbe dois" />
        <span className="ctg-grade" />
      </div>

      <div className="ctg-meio">
        <img className="ctg-marca" src={logo} alt="Intermedi" width="1920" height="1080" />

        <p className="ctg-selo">
          <span className="ctg-selo-ponto" aria-hidden="true" />
          Lançamento · {quando.dia}
        </p>

        <h1 className="ctg-titulo" aria-live="polite">
          {chegou ? (
            <>Chegou a <strong>hora!</strong></>
          ) : (
            <>Falta pouco para o <strong>lançamento</strong></>
          )}
        </h1>

        <p className="ctg-texto">
          {chegou ? (
            "Abrindo a amostra grátis do Intermedi…"
          ) : (
            <>
              A amostra grátis do Intermedi abre <strong>{quando.horario} de {quando.semana}</strong> (horário de Brasília).
              Quando a contagem chegar a zero, o acesso abre sozinho nesta página.
            </>
          )}
        </p>

        <div className="ctg-relogio" role="timer" aria-label={`Faltam ${dias} ${plural(dias, "dia", "dias")}, ${horas} ${plural(horas, "hora", "horas")} e ${minutos} ${plural(minutos, "minuto", "minutos")}`}>
          {blocos.map((b, i) => (
            <div className="ctg-bloco" key={i} aria-hidden="true">
              <span className="ctg-numero">
                {/* a chave troca a cada valor: o número novo entra deslizando */}
                <span key={b.valor}>{doisDigitos(b.valor)}</span>
              </span>
              <span className="ctg-rotulo">{b.rotulo}</span>
            </div>
          ))}
        </div>

        {!chegou && (
          <div className="ctg-acoes">
            <VideoPlataforma />
            {instagram && (
              <a className="ctg-link" href={`https://www.instagram.com/${instagram}/`} target="_blank" rel="noopener noreferrer">
                Acompanhe a Auvox no Instagram
              </a>
            )}
          </div>
        )}
      </div>

      <AssinaturaAuvox className="ctg-assinatura" />
    </main>
  );
}
