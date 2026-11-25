import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import wordmark from "../assets/brand/wordmark-light.png";
import { Mascote } from "../shared/Mascote";
import "./encerrada.css";

/** Endereço que não existe na amostra: mesma cara da tela de fim de acesso. */
export default function NaoEncontrada() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = "Página não encontrada | Intermedi Demo";
    return () => { document.title = "Intermedi Demo"; };
  }, []);
  return (
    <main className="fim" id="conteudo">
      <div className="fim-fundo" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="fim-conteudo">
        <img className="fim-marca" src={wordmark} alt="Intermedi" width="581" height="370" />
        <p className="fim-codigo">Erro 404</p>
        <h1>Esta página não existe.</h1>
        <p>
          O endereço <code className="fim-endereco">{pathname}</code> não faz parte da amostra do Intermedi. Ele pode ter
          mudado ou sido digitado errado.
        </p>
        <div className="fim-acoes">
          <Link to="/" className="fim-botao">Voltar à amostra</Link>
          <Link to="/bastidores" className="fim-botao is-secundario">Ver os bastidores</Link>
        </div>
      </div>
      <div className="fim-mascote" aria-hidden="true">
        <Mascote id="broto" tamanho={260} />
      </div>
    </main>
  );
}
