import logo from "../assets/brand/logo-intermedi.webp";
import { Dialogo } from "./Dialogo";

const ITENS = [
  "Alguns dados e operações são fictícios.",
  "Os processos de solicitação e entrega podem ser simulados.",
  "Nenhuma operação altera dados reais.",
  "O acesso é temporário e dura três horas a partir de agora.",
  "Cadastro, edição e exclusão de dados reais não estão disponíveis.",
];

/** Aviso mostrado uma única vez, antes da primeira experiência da sessão. */
export function AvisoDemo({ onComecar, onFechar }: { onComecar: () => void; onFechar: () => void }) {
  return (
    <Dialogo rotulo="Bem-vindo ao Intermedi Demo!" onFechar={onFechar}>
      <div className="demo-dialogo-corpo">
        <img className="aviso-marca" src={logo} alt="Intermedi" width="1920" height="1080" style={{ width: 132, height: "auto", marginLeft: -10 }} />
        <h2>Bem-vindo ao Intermedi Demo!</h2>
        <p className="demo-dialogo-texto">
          Esta é uma versão demonstrativa desenvolvida especialmente para apresentar as funcionalidades do Intermedi.
        </p>
        <ul className="aviso-lista">
          {ITENS.map((item) => (
            <li key={item}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 3 3 5-6" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
        <div className="aviso-rodape">
          <small>Versão demonstrativa · Modo Demo</small>
          <button type="button" className="demo-botao" onClick={onComecar} autoFocus>
            Começar experiência
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
