import { useId, useState, type FormEvent } from "react";
import {
  ALVOS,
  LIMITE_COMENTARIO,
  provedor,
  registrarAvaliacao,
  useAvaliacoes,
  validarAvaliacao,
  type ErrosAvaliacao,
} from "../demoServices/feedbackService";
import { dispensarConviteAvaliacao } from "../session/session";
import { useProgresso } from "../session/hooks";
import type { AlvoAvaliacao } from "../types";
import { Dialogo } from "./Dialogo";

const SIGNIFICADO = ["", "Ruim", "Pode melhorar", "Bom", "Muito bom", "Excelente"];

function Estrela() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2L2.9 9.4l6.3-.9L12 2.8Z" />
    </svg>
  );
}

/** "O que achou do Intermedi?" — registra só neste navegador (ver feedbackService). */
export function AvaliacaoDialogo({ alvoInicial = "geral", onFechar }: { alvoInicial?: AlvoAvaliacao; onFechar: () => void }) {
  const uid = useId();
  const avaliacoes = useAvaliacoes();
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [alvo, setAlvo] = useState<AlvoAvaliacao>(alvoInicial);
  const [comentario, setComentario] = useState("");
  const [erros, setErros] = useState<ErrosAvaliacao>({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(false);
  const existente = avaliacoes.find((a) => a.alvo === alvo);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    const encontrados = validarAvaliacao({ nota, alvo, comentario });
    setErros(encontrados);
    setErroEnvio("");
    if (Object.keys(encontrados).length) {
      document.getElementById(encontrados.nota ? `${uid}-nota-1` : `${uid}-comentario`)?.focus();
      return;
    }
    setEnviando(true);
    try {
      await registrarAvaliacao({ nota, alvo, comentario });
      setFeito(true);
    } catch (erro) {
      setErroEnvio(erro instanceof Error ? erro.message : "Não foi possível registrar a avaliação.");
    } finally {
      setEnviando(false);
    }
  }

  if (feito) {
    return (
      <Dialogo rotulo="Avaliação registrada" onFechar={onFechar}>
        <div className="demo-dialogo-corpo av-feito" role="status">
          <span className="av-feito-marca" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 12.5 4 4 8-9" />
            </svg>
          </span>
          <h2>{provedor.enviaParaEquipe ? "Avaliação enviada para a equipe." : "Avaliação registrada nesta demonstração."}</h2>
          <p className="demo-dialogo-texto">
            {provedor.enviaParaEquipe
              ? "Obrigado por contar o que achou."
              : "Ela fica guardada só neste navegador, junto com a sua sessão demonstrativa. Obrigado por contar o que achou."}
          </p>
          <button type="button" className="demo-botao" onClick={onFechar} autoFocus>
            Voltar
          </button>
        </div>
      </Dialogo>
    );
  }

  const exibida = hover || nota;
  return (
    <Dialogo rotulo="O que achou do Intermedi?" onFechar={onFechar}>
      <form className="demo-dialogo-corpo av-form" onSubmit={enviar} noValidate aria-busy={enviando}>
        <div>
          <h2>O que achou do Intermedi?</h2>
          <p className="demo-dialogo-texto" style={{ marginTop: 8 }}>Leva menos de um minuto. {provedor.enviaParaEquipe ? "Sua opinião vai direto para a equipe da Auvox." : "Sua opinião fica registrada nesta demonstração."}</p>
        </div>

        <fieldset aria-describedby={erros.nota ? `${uid}-erro-nota` : `${uid}-nota-texto`}>
          <legend>Sua avaliação</legend>
          <div className="av-estrelas" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={`av-estrela${n <= exibida ? " is-ativa" : ""}`} onMouseEnter={() => setHover(n)}>
                <input
                  id={`${uid}-nota-${n}`}
                  type="radio"
                  name={`${uid}-nota`}
                  value={n}
                  checked={nota === n}
                  onChange={() => {
                    setNota(n);
                    setErros((e) => ({ ...e, nota: undefined }));
                  }}
                  aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}: ${SIGNIFICADO[n]}`}
                />
                <Estrela />
              </label>
            ))}
          </div>
          <p className="av-nota-texto" id={`${uid}-nota-texto`} aria-live="polite">
            {exibida ? `${exibida} de 5 · ${SIGNIFICADO[exibida]}` : "Toque nas estrelas para dar uma nota."}
          </p>
          {erros.nota && <p className="av-erro" id={`${uid}-erro-nota`}>{erros.nota}</p>}
        </fieldset>

        <fieldset>
          <legend>O que deseja avaliar?</legend>
          <div className="av-alvos">
            {ALVOS.map(({ valor, rotulo }) => (
              <label key={valor} className={`av-alvo${alvo === valor ? " is-ativo" : ""}`}>
                <input type="radio" name={`${uid}-alvo`} value={valor} checked={alvo === valor} onChange={() => setAlvo(valor)} />
                {rotulo}
              </label>
            ))}
          </div>
          {existente && (
            <p className="av-nota-texto">Você já avaliou este item com {existente.nota} de 5. Registrar de novo substitui a avaliação anterior.</p>
          )}
        </fieldset>

        <label htmlFor={`${uid}-comentario`}>
          <span>O que poderíamos melhorar? <small style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</small></span>
          <textarea
            id={`${uid}-comentario`}
            value={comentario}
            maxLength={LIMITE_COMENTARIO}
            onChange={(e) => setComentario(e.target.value)}
            aria-describedby={`${uid}-contador`}
            aria-invalid={Boolean(erros.comentario)}
            placeholder="Conte o que gostou ou o que mudaria"
          />
          <small className="av-contador" id={`${uid}-contador`}>{comentario.length}/{LIMITE_COMENTARIO}</small>
          {erros.comentario && <p className="av-erro">{erros.comentario}</p>}
        </label>

        {erroEnvio && <p className="av-erro" role="alert">{erroEnvio}</p>}

        <div className="av-acoes">
          <button type="button" className="demo-botao-sec" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="demo-botao" disabled={enviando}>
            {enviando ? "Registrando…" : "Registrar avaliação"}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}

/** Convite discreto depois de uma simulação concluída. Não interrompe o uso. */
export function ConviteAvaliacao({ alvo, texto }: { alvo: AlvoAvaliacao; texto: string }) {
  const dispensado = useProgresso((p) => p.conviteAvaliacaoDispensado);
  const jaAvaliou = useAvaliacoes().some((a) => a.alvo === alvo);
  const [aberto, setAberto] = useState(false);
  if (dispensado || jaAvaliou) return aberto ? <AvaliacaoDialogo alvoInicial={alvo} onFechar={() => setAberto(false)} /> : null;
  return (
    <>
      <aside className="convite-avaliar" aria-label="Avaliar o Intermedi">
        <p><strong>{texto}</strong> Que tal contar o que achou do Intermedi?</p>
        <div className="convite-avaliar-acoes">
          <button type="button" className="is-sec" onClick={dispensarConviteAvaliacao}>Agora não</button>
          <button type="button" className="is-principal" onClick={() => setAberto(true)}>Avaliar</button>
        </div>
      </aside>
      {aberto && <AvaliacaoDialogo alvoInicial={alvo} onFechar={() => setAberto(false)} />}
    </>
  );
}
