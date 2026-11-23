import { Link } from "react-router-dom";

// Fluxo de reposição da unidade: do pedido à rede até o remédio recebido.
export default function FlowStrip({ fluxo, onAbrir }) {
  const etapas = [
    { id: "rede", rotulo: "Pedidos à rede", valor: fluxo.aguardandoFornecedor, detalhe: "aguardando a fornecedora", link: "../pedidos" },
    {
      id: "doca",
      rotulo: "A caminho",
      valor: fluxo.aCaminho,
      detalhe: "entregas vindo de outras farmácias",
    },
    { id: "recebidos", rotulo: "Recebidos", valor: fluxo.recebidos30, detalhe: "nos últimos 30 dias", link: "../pedidos" },
  ];
  return (
    <section className="op-fluxo" aria-label="Fluxo de reposição">
      <h2>Fluxo de reposição</h2>
      <ol>
        {etapas.map((e) => {
          const conteudo = (
            <>
              <strong>{e.valor}</strong>
              <span>{e.rotulo}</span>
              <small>{e.detalhe}</small>
            </>
          );
          return (
            <li key={e.id}>
              {e.link ? (
                <Link to={e.link} className="op-fluxo-etapa">{conteudo}</Link>
              ) : (
                <button type="button" className="op-fluxo-etapa" onClick={() => onAbrir(e.id)}>{conteudo}</button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
