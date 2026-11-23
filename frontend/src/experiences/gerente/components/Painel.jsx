// Peças da visão geral do intermedi-frontend: Ferramentas.jsx e Directory.jsx
// (DirectoryStats, CartaoPessoa, GradePessoas). Única adição: atalhos que a
// demonstração não permite (cadastros) aparecem bloqueados, com o motivo,
// em vez de parecerem funcionais.
import { Link } from "react-router-dom";
import { ManagerIcon } from "../../../shared/icons";
import NumeroAnimado from "./NumeroAnimado";
import PersonaAvatar from "./PersonaAvatar";
import { propsLinha } from "../lib/util";

export const paraIdentificador = (texto) =>
  String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// itens: [{ to | onClick, icone, titulo, descricao, contador?, bloqueado? }]
export function Ferramentas({ titulo = "Ferramentas", itens }) {
  return (
    <section className="mgr-ferramentas" aria-label={titulo}>
      <h2>{titulo}</h2>
      <div className="mgr-ferramentas-grade">
        {itens.map(({ to, onClick, icone, titulo: nome, descricao, contador, bloqueado }) =>
          onClick ? (
            <button key={nome} type="button" className="mgr-ferramenta" onClick={onClick} data-track={`atalho:${paraIdentificador(nome)}`}>
              <span className="mgr-ferramenta-icone" aria-hidden="true">
                <ManagerIcon name={icone} size={22} />
              </span>
              <span className="mgr-ferramenta-texto">
                <strong>{nome}</strong>
                <small>{descricao}</small>
              </span>
            </button>
          ) : bloqueado ? (
            <div key={nome} className="mgr-ferramenta is-bloqueada" aria-disabled="true" data-track={`atalho:${paraIdentificador(nome)}`}>
              <span className="mgr-ferramenta-icone" aria-hidden="true">
                <ManagerIcon name={icone} size={22} />
              </span>
              <span className="mgr-ferramenta-texto">
                <strong>{nome}</strong>
                <small>Indisponível no Modo Demo</small>
              </span>
              <span className="mgr-ferramenta-cadeado" aria-hidden="true"><ManagerIcon name="lock" size={16} /></span>
            </div>
          ) : (
            <Link key={to} to={to} className="mgr-ferramenta" data-track={`atalho:${paraIdentificador(nome)}`}>
              <span className="mgr-ferramenta-icone" aria-hidden="true">
                <ManagerIcon name={icone} size={22} />
              </span>
              <span className="mgr-ferramenta-texto">
                <strong>{nome}</strong>
                <small>{descricao}</small>
              </span>
              {contador > 0 && (
                <span className="mgr-ferramenta-contador" aria-label={`${contador} pendentes`}>
                  {contador}
                </span>
              )}
            </Link>
          ),
        )}
      </div>
    </section>
  );
}

// items: [rótulo, valor, ícone, contexto?, link?]
export function DirectoryStats({ items }) {
  return (
    <div className="directory-stats">
      {items.map(([label, value, icon = "people", hint, to]) => {
        const conteudo = (
          <>
            <span className="directory-stat-icon"><ManagerIcon name={icon} size={18} /></span>
            <div>
              <p>{label}</p>
              <strong><NumeroAnimado valor={value ?? "—"} /></strong>
              {hint && <small>{hint}</small>}
            </div>
          </>
        );
        return to ? (
          <Link className="directory-stat is-link" key={label} to={to} data-track={`card:${paraIdentificador(label)}`}>{conteudo}</Link>
        ) : (
          <article className="directory-stat" key={label}>{conteudo}</article>
        );
      })}
    </div>
  );
}

const ROTULO_PAPEL = { paciente: "Paciente", funcionario: "Funcionário", gerente: "Gerente" };

// Cartão de pessoa no formato do perfil dela (Directory.jsx). Na demonstração
// o cartão abre um resumo local, sem dados pessoais.
export function CartaoPessoa({ role, nome, papel, linhas = /** @type {[string, string][]} */ ([]), selo = undefined, onAbrir }) {
  return (
    <article {...propsLinha((el) => onAbrir(el), `Abrir resumo de ${nome}`)} className={`perfil-linha cartao-pessoa cartao-pessoa-${role}`}>
      <div className="cartao-pessoa-faixa" aria-hidden="true" />
      {selo && <span className="cartao-pessoa-selo">{selo}</span>}
      <div className="cartao-pessoa-corpo">
        <PersonaAvatar className="cartao-pessoa-avatar" role={role} photo={null} name={nome} />
        <p className="cartao-pessoa-papel">{papel || ROTULO_PAPEL[role]}</p>
        <h3>{nome}</h3>
        {linhas.filter((l) => l && l[1]).length > 0 && (
          <ul className="cartao-pessoa-linhas">
            {linhas.filter((l) => l && l[1]).map(([icone, texto]) => (
              <li key={`${icone}-${texto}`}><ManagerIcon name={icone} size={14} /><span>{texto}</span></li>
            ))}
          </ul>
        )}
      </div>
      <footer className="cartao-pessoa-rodape">
        <button type="button" className="cartao-pessoa-ver" onClick={(e) => onAbrir(e.currentTarget.closest("article"))}>
          Ver resumo <span aria-hidden="true">→</span>
        </button>
      </footer>
    </article>
  );
}

export function GradePessoas({ children, rotulo }) {
  return <ul className="grade-pessoas" aria-label={rotulo}>{children}</ul>;
}
