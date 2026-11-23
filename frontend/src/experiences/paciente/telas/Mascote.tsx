// Escolha do mascote (mascote.tsx do intermedi-app).
import { escolherMascote, usePaciente, type MascoteId } from "../../../demoServices/patientService";
import { MASCOTES, Mascote as Figura } from "../../../shared/Mascote";
import { Cabecalho } from "../components/ui";

export default function Mascote() {
  const atual = usePaciente((p) => p.mascote);
  return (
    <div className="a-tela">
      <Cabecalho voltar titulo="Seu mascote" subtitulo="Quem vai te acompanhar no app" />
      <div className="a-corpo" role="radiogroup" aria-label="Mascotes">
        {(Object.keys(MASCOTES) as MascoteId[]).map((id) => {
          const m = MASCOTES[id];
          const ativo = atual === id;
          return (
            <button key={id} type="button" role="radio" aria-checked={ativo} className={`a-mascote-opcao${ativo ? " is-ativo" : ""}`} style={{ "--m-suave": m.suave, "--m-destaque": m.destaque } as React.CSSProperties} onClick={() => escolherMascote(id)}>
              <span className="a-mascote-figura"><Figura id={id} tamanho={96} sombra={false} /></span>
              <span className="a-flex">
                <span className="t-h3">{m.nome}</span>
                <span className="t-label a-negrito" style={{ color: m.destaque }}>{m.jeito}</span>
                <span className="t-label">{m.descricao}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
