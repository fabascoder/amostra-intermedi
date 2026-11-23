// Agradecimento mostrado uma vez, quando o visitante já conheceu as três
// experiências (farmácia solicitante, farmácia fornecedora e aplicativo).
import { Dialogo } from "./Dialogo";
import "./agradecimento.css";

export function Agradecimento({ nome, onAvaliar, onVoltar }: { nome: string; onAvaliar: () => void; onVoltar: () => void }) {
  return (
    <Dialogo rotulo="Obrigado por comparecer à apresentação" onFechar={onVoltar} className="agradecimento">
      <div className="demo-dialogo-corpo agradecimento-corpo">
        <div className="agradecimento-selo" aria-hidden="true">
          <span className="agradecimento-onda" />
          <span className="agradecimento-onda dois" />
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" />
            <path d="m15 27 7.5 7.5L38 19" />
          </svg>
        </div>
        <p className="agradecimento-etapas">3 de 3 experiências visitadas</p>
        <h2>Obrigado por comparecer à apresentação do Intermedi!</h2>
        <p className="demo-dialogo-texto">
          {nome ? `Obrigado, ${nome}.` : "Obrigado, visitante."} Você conheceu a farmácia que pede, a farmácia que atende e o
          aplicativo do paciente. Conte o que achou: sua avaliação ajuda a melhorar a plataforma.
        </p>
        <div className="agradecimento-botoes">
          <button type="button" className="demo-botao" onClick={onAvaliar} autoFocus>
            Avaliar o Intermedi
          </button>
          <button type="button" className="demo-botao-sec" onClick={onVoltar}>
            Voltar
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
