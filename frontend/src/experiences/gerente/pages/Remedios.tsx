// Estoque de remédios (pages/ManagerMedicines.jsx do intermedi-frontend):
// resumo clicável, busca, filtro por situação e a tabela do estoque. Na
// demonstração não há cadastro, entrada, ajuste nem remoção: a tabela é de
// consulta, e a farmácia solicitante pode pedir o remédio à rede.
// Abaixo, o catálogo da rede: todos os remédios e em quantas farmácias há estoque.
import { useDeferredValue, useMemo, useState } from "react";
import { buscarRemedios, disponibilidade, estoqueDaFarmacia, listarRemedios, resumoEstoque } from "../../../demoServices/medicationService";
import { ManagerIcon } from "../../../shared/icons";
import { EstoqueTabela, FotoRemedio, ResumoEstoque, TarjaBadge } from "../components/Remedios";
import { useGerente } from "../contexto";
import { nomeComDosagem, ordenarEstoque } from "../lib/remedios";
import { propsLinha } from "../lib/util";

const FILTROS_SITUACAO: [string, string][] = [
  ["", "Todas as situações"],
  ["ok", "Em estoque"],
  ["critico", "Críticos"],
  ["zerado", "Zerados"],
  ["vencido", "Lote vencido"],
];

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Remedios() {
  const { config, visao, pedirARede, abrirRemedio } = useGerente();
  const solicitante = config.id === "solicitante";
  const [busca, setBusca] = useState("");
  const [situacaoFiltro, setSituacaoFiltro] = useState("");
  const [buscaRede, setBuscaRede] = useState("");
  const buscaAdiada = useDeferredValue(busca);
  const buscaRedeAdiada = useDeferredValue(buscaRede);

  const linhas = useMemo(() => estoqueDaFarmacia(config.idFarmacia, visao.ajustes), [config.idFarmacia, visao.ajustes]);
  const resumo = resumoEstoque(linhas);
  const itens = useMemo(() => {
    const q = normalizar(buscaAdiada.trim());
    return ordenarEstoque(
      linhas.filter((l) => {
        if (q && !normalizar(`${l.nomeRemedio} ${l.dosagemRemedio} ${l.fabricanteRemedio}`).includes(q)) return false;
        if (situacaoFiltro === "vencido") return l.vencido;
        return !situacaoFiltro || l.situacao === situacaoFiltro;
      }),
    );
  }, [linhas, buscaAdiada, situacaoFiltro]);

  const catalogo = useMemo(
    () => buscarRemedios(buscaRedeAdiada, listarRemedios()).map((r) => ({ remedio: r, ofertas: disponibilidade(r.idRemedio, visao.ajustes, config.idFarmacia) })),
    [buscaRedeAdiada, visao.ajustes, config.idFarmacia],
  );

  return (
    <>
      <header className="mgr-page-head">
        <div>
          <h1>Estoque de remédios</h1>
          <p>{config.unidade} · Consulte o estoque da unidade e o que a rede tem de cada remédio.</p>
        </div>
        <div className="demo-acao-bloqueada">
          <button type="button" className="mgr-primary" disabled aria-describedby="motivo-adicionar">
            <ManagerIcon name="lock" size={16} /> Adicionar do catálogo
          </button>
          <small id="motivo-adicionar">Cadastro indisponível no Modo Demo</small>
        </div>
      </header>

      <ResumoEstoque resumo={resumo} filtro={situacaoFiltro} onFiltrar={setSituacaoFiltro} />

      <section className="mgr-panel" aria-label="Estoque da farmácia">
        <div className="mgr-toolbar">
          <input type="search" aria-label="Buscar no estoque" placeholder="Buscar remédio no estoque…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select aria-label="Filtrar por situação" value={situacaoFiltro} onChange={(e) => setSituacaoFiltro(e.target.value)}>
            {FILTROS_SITUACAO.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
          </select>
        </div>
        {itens.length ? (
          <EstoqueTabela
            itens={itens}
            onAbrir={(item: { idRemedio: number }) => abrirRemedio(item.idRemedio)}
            acoes={(item: { idRemedio: number; nomeRemedio: string; situacao: string }) => (
              <>
                <button type="button" className="directory-row-action" aria-label={`Ver detalhes de ${item.nomeRemedio}`} onClick={() => abrirRemedio(item.idRemedio)}>
                  Detalhes
                </button>
                {solicitante && (
                  <button
                    type="button"
                    className={`directory-row-action${item.situacao !== "ok" ? " demo-acao-destaque" : ""}`}
                    aria-label={`Pedir ${item.nomeRemedio} à rede`}
                    onClick={() => pedirARede(item.idRemedio)}
                  >
                    Pedir à rede
                  </button>
                )}
              </>
            )}
          />
        ) : (
          <div className="mgr-empty">
            <p>Nenhum remédio do estoque corresponde a estes filtros.</p>
          </div>
        )}
        <p className="mgr-table-note" role="status">
          {itens.length} {itens.length === 1 ? "item" : "itens"} · Crítico: quantidade no mínimo ou abaixo · Lote vencido não pode ser entregue.
        </p>
      </section>

      <section className="mgr-panel demo-catalogo" aria-labelledby="catalogo-rede">
        <div className="mgr-panel-head">
          <div>
            <h2 id="catalogo-rede">Remédios na rede</h2>
            <p>Catálogo geral e quantas outras farmácias têm cada remédio em estoque.</p>
          </div>
        </div>
        <div className="mgr-toolbar">
          <input
            type="search"
            aria-label="Pesquisar no catálogo da rede"
            placeholder="Pesquisar por nome, princípio ativo ou categoria…"
            value={buscaRede}
            onChange={(e) => setBuscaRede(e.target.value)}
          />
        </div>
        {catalogo.length ? (
          <ul className="demo-catalogo-lista">
            {catalogo.map(({ remedio, ofertas }) => (
              <li key={remedio.idRemedio} {...propsLinha(() => abrirRemedio(remedio.idRemedio), `Ver detalhes de ${remedio.nomeRemedio}`)} className="perfil-linha demo-catalogo-item">
                <FotoRemedio nome={remedio.nomeRemedio} />
                <div className="demo-catalogo-texto">
                  <strong>{nomeComDosagem(remedio)}</strong>
                  <small>{remedio.principioAtivo} · {remedio.categorias.join(", ")}</small>
                  <TarjaBadge valor={remedio.tarjaRemedio} />
                </div>
                <span className={`mgr-badge chamado-badge ${ofertas.length ? "green" : "neutral"}`}>
                  {ofertas.length ? `${ofertas.length} ${ofertas.length === 1 ? "farmácia" : "farmácias"}` : "Sem estoque na rede"}
                </span>
                {solicitante && ofertas.length > 0 && (
                  <button type="button" className="directory-row-action" onClick={() => pedirARede(remedio.idRemedio)} aria-label={`Pedir ${remedio.nomeRemedio} à rede`}>
                    Pedir à rede
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mgr-empty">Nenhum remédio do catálogo corresponde a esta pesquisa.</p>
        )}
      </section>
    </>
  );
}
