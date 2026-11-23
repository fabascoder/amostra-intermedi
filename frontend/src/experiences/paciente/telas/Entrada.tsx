// "Como podemos chamar você?" — a única pergunta antes de entrar no app.
// Visual da apresentação do mascote do intermedi-app (boas-vindas.tsx):
// campo verde, balão branco e o mascote. Sem CPF, e-mail ou senha.
import { useId, useState, type FormEvent } from "react";
import wordmark from "../../../assets/brand/wordmark-light.png";
import { definirNome, limparNome } from "../../../demoServices/patientService";
import { Mascote } from "../../../shared/Mascote";
import { TrocarExperiencia } from "../../../shared/Sessao";

export default function Entrada() {
  const uid = useId();
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  function entrar(e: FormEvent) {
    e.preventDefault();
    const limpo = limparNome(nome);
    if (limpo.length < 2) {
      setErro("Digite seu primeiro nome, com pelo menos 2 letras.");
      return;
    }
    if (!definirNome(limpo)) setErro("Não foi possível entrar agora. Volte à Central e tente de novo.");
  }

  return (
    <div className="a-entrada-tela">
      <span className="a-entrada-circulo um" aria-hidden="true" />
      <span className="a-entrada-circulo dois" aria-hidden="true" />
      <div className="a-entrada-topo">
        <img src={wordmark} alt="Intermedi" width="581" height="370" className="a-entrada-marca" />
        <TrocarExperiencia className="a-entrada-trocar" rotulo="Voltar" />
      </div>
      <div className="a-entrada-balao">
        <p className="t-label a-negrito" style={{ color: "#0E6B50" }}>Broto</p>
        <h1 className="t-h3 a-entrada-ola">Oi! Prazer, eu sou o Broto.</h1>
        <p className="t-label" style={{ color: "#33423C" }}>Vou te ajudar a achar remédios perto de você, lembrar das doses e usar o app sem complicação.</p>
        <i className="a-entrada-rabo" aria-hidden="true" />
      </div>
      <div className="a-entrada-palco" aria-hidden="true">
        <span className="a-entrada-halo" />
        <Mascote id="broto" tamanho={190} />
      </div>
      <form className="a-entrada-form" onSubmit={entrar} noValidate>
        <label htmlFor={`${uid}-nome`} className="t-h3 a-entrada-pergunta">Como podemos chamar você?</label>
        <input
          id={`${uid}-nome`}
          className="a-entrada-campo"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErro("");
          }}
          placeholder="Seu primeiro nome"
          autoComplete="given-name"
          autoCapitalize="words"
          maxLength={40}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${uid}-erro` : `${uid}-dica`}
          enterKeyHint="go"
        />
        {erro ? (
          <p id={`${uid}-erro`} className="a-entrada-erro" role="alert">{erro}</p>
        ) : (
          <p id={`${uid}-dica`} className="a-entrada-dica">Só o primeiro nome. Ele fica neste aparelho durante a demonstração.</p>
        )}
        <button type="submit" className="a-botao b-solidLight is-largo">Entrar no aplicativo</button>
      </form>
    </div>
  );
}
