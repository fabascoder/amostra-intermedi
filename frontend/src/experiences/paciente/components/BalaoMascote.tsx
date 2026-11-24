// Balão de fala do mascote na tela inicial: a mensagem no jeito do mascote
// escolhido e um cronômetro até a próxima dose. A cor vai do verde ao
// vermelho conforme a hora se aproxima (janela de 3 horas); atrasada, fica
// vermelha e pulsa.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marcarDose, minutosDe, usePaciente } from "../../../demoServices/patientService";
import { MascoteAvatar } from "../../../shared/Mascote";
import type { Remedio } from "../../../types";
import { FALAS } from "../personalidade";
import { Botao } from "./ui";

type DoseDoDia = { id: string; horario: string; remedio: Remedio; status?: "tomado" | "pulado" };

const JANELA_MS = 3 * 60 * 60 * 1000;

/** Data de hoje (ou amanhã) no horário "HH:MM". */
function quando(horario: string, diasAFrente = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  d.setHours(Math.floor(minutosDe(horario) / 60), minutosDe(horario) % 60, 0, 0);
  return d.getTime();
}

function relogio(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

/** Verde (longe) → amarelo → vermelho (na hora). */
function corDoTempo(restanteMs: number): string {
  const f = Math.min(1, Math.max(0, restanteMs / JANELA_MS));
  return `hsl(${Math.round(f * 135)} 72% ${Math.round(38 + (1 - f) * 6)}%)`;
}

export function BalaoMascote({ doses }: { doses: DoseDoDia[] }) {
  const navigate = useNavigate();
  const mascote = usePaciente((p) => p.mascote);
  const f = FALAS[mascote];
  const [agora, setAgora] = useState(Date.now());
  const [acabouDeTomar, setAcabouDeTomar] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!acabouDeTomar) return undefined;
    const id = window.setTimeout(() => setAcabouDeTomar(false), 3500);
    return () => window.clearTimeout(id);
  }, [acabouDeTomar]);

  const pendentes = doses.filter((d) => !d.status).sort((a, b) => minutosDe(a.horario) - minutosDe(b.horario));
  const atrasada = pendentes.find((d) => quando(d.horario) <= agora);
  const proximaHoje = pendentes.find((d) => quando(d.horario) > agora);
  const amanha = !pendentes.length && doses.length ? [...doses].sort((a, b) => minutosDe(a.horario) - minutosDe(b.horario))[0] : undefined;

  let mensagem: string;
  let alvo: number | null = null;
  let dose: DoseDoDia | undefined;
  if (!doses.length) {
    mensagem = f.semRotina;
  } else if (atrasada) {
    dose = atrasada;
    mensagem = f.atrasada(atrasada.remedio.nomeRemedio, atrasada.horario);
  } else if (proximaHoje) {
    dose = proximaHoje;
    alvo = quando(proximaHoje.horario);
    mensagem = alvo - agora <= 30 * 60 * 1000 ? f.quaseHora(proximaHoje.remedio.nomeRemedio) : f.proxima(proximaHoje.remedio.nomeRemedio, proximaHoje.horario);
  } else {
    mensagem = f.emDia;
    if (amanha) alvo = quando(amanha.horario, 1);
  }
  if (acabouDeTomar) mensagem = f.tomou;

  const restante = alvo !== null ? alvo - agora : 0;
  const cor = atrasada ? "hsl(0 72% 44%)" : alvo !== null ? corDoTempo(restante) : undefined;
  const atrasoMin = atrasada ? Math.max(1, Math.floor((agora - quando(atrasada.horario)) / 60000)) : 0;

  return (
    <section className={`a-balao-mascote${atrasada ? " is-atrasada" : ""}`} aria-label="Recado do seu mascote">
      <span className="a-balao-mascote-avatar"><MascoteAvatar id={mascote} tamanho={64} /></span>
      <div className="a-balao-mascote-fala" style={cor ? ({ "--a-tempo": cor } as React.CSSProperties) : undefined}>
        <p key={mensagem} className="t-body a-balao-mascote-texto">{mensagem}</p>
        {(alvo !== null || atrasada) && (
          <div className="a-cronometro" role="timer" aria-live="off">
            <span className="t-caption a-cronometro-rotulo">
              {atrasada ? "Atrasada há" : proximaHoje ? `Próxima dose · ${proximaHoje.remedio.nomeRemedio}` : `Amanhã · ${amanha?.remedio.nomeRemedio}`}
            </span>
            <span className="a-cronometro-valor">
              {atrasada ? `${atrasoMin} min` : relogio(restante)}
            </span>
            <span className="a-cronometro-trilho" aria-hidden="true">
              <i style={{ width: atrasada ? "100%" : `${Math.round((1 - Math.min(1, restante / JANELA_MS)) * 100)}%` }} />
            </span>
          </div>
        )}
        <div className="a-balao-mascote-acoes">
          {dose && !acabouDeTomar ? (
            <Botao compacto larguraTotal={false} titulo="Tomei" onClick={() => { marcarDose(dose!.id, "tomado"); setAcabouDeTomar(true); }} />
          ) : !doses.length ? (
            <Botao compacto larguraTotal={false} titulo="Montar rotina" onClick={() => navigate("/aplicativo/remedios")} />
          ) : (
            <Botao compacto larguraTotal={false} variante="soft" titulo="Ver rotina" onClick={() => navigate("/aplicativo/comprimidos")} />
          )}
        </div>
      </div>
    </section>
  );
}
