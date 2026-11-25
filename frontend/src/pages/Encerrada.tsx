import { useEffect } from "react";
import wordmark from "../assets/brand/wordmark-light.png";
import { CONTACT } from "../config/demo";
import { Mascote } from "../shared/Mascote";
import { useNomeDaSessao } from "../session/hooks";
import "./encerrada.css";

/**
 * Fim do acesso. Não há botão que reinicie as três horas: quem reativa é a
 * equipe, abrindo o link de reativação (session/reativacao.ts) neste aparelho.
 */
export default function Encerrada() {
  useEffect(() => {
    document.title = "Experiência encerrada | Intermedi Demo";
  }, []);
  const nome = useNomeDaSessao();
  const temContato = Boolean(CONTACT.email || CONTACT.phone || CONTACT.site);
  // abre a conversa com a equipe e a mensagem pronta; a equipe responde com o link de reativação
  const numero = CONTACT.whatsapp.replace(/\D/g, "");
  const mensagem = `Oi! ${nome ? `Sou ${nome} e meu` : "Meu"} acesso ao Intermedi Demo terminou. Pode liberar um novo acesso?`;
  const linkWhatsapp = numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}` : "";
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
          Quer explorar de novo? Peça um novo acesso à nossa equipe. Você vai entrar numa <strong>nova sessão</strong>,
          com mais 3 horas, começando do início: as solicitações, avaliações e o progresso desta visita não continuam.
        </p>

        <div className="fim-contato">
          <p className="fim-presencial">Procure nossa equipe durante a apresentação.</p>
          {linkWhatsapp && (
            <a className="fim-whatsapp" href={linkWhatsapp} target="_blank" rel="noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
              </svg>
              Pedir novo acesso pelo WhatsApp
            </a>
          )}
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
