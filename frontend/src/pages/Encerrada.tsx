import { useEffect } from "react";
import wordmark from "../assets/brand/wordmark-light.png";
import { CONTACT } from "../config/demo";
import { Mascote } from "../shared/Mascote";
import "./encerrada.css";

/**
 * Fim do acesso. Não há botão que reinicie as três horas: quem reativa é a
 * equipe, abrindo o link de reativação (session/reativacao.ts) neste aparelho.
 */
export default function Encerrada() {
  useEffect(() => {
    document.title = "Experiência encerrada | Intermedi Demo";
  }, []);
  const temContato = Boolean(CONTACT.email || CONTACT.phone || CONTACT.site);
  return (
    <main className="fim" id="conteudo">
      <div className="fim-fundo" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="fim-conteudo">
        <img className="fim-marca" src={wordmark} alt="Intermedi" width="581" height="370" />
        <h1>Sua experiência chegou ao fim.</h1>
        <p className="fim-obrigado">Obrigado por conhecer o Intermedi!</p>
        <p>Seu período de acesso à versão demonstrativa foi encerrado.</p>
        <p>
          Gostaria de explorar a plataforma novamente? Entre em contato com nossa equipe para solicitar um novo acesso.
        </p>

        <div className="fim-contato">
          <p className="fim-presencial">Procure nossa equipe durante a apresentação.</p>
          {temContato && (
            <ul>
              {CONTACT.email && <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>}
              {CONTACT.phone && <li><a href={`tel:${CONTACT.phone.replace(/\D/g, "")}`}>{CONTACT.phone}</a></li>}
              {CONTACT.site && <li><a href={CONTACT.site} target="_blank" rel="noreferrer">{CONTACT.site.replace(/^https?:\/\//, "")}</a></li>}
            </ul>
          )}
        </div>

        <p className="fim-prazer">Foi um prazer apresentar nossa solução a você.</p>
      </div>
      <div className="fim-mascote" aria-hidden="true">
        <Mascote id="broto" tamanho={260} />
      </div>
    </main>
  );
}
