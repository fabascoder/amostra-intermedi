// Detalhe do remédio: os campos do catálogo (tabela remedio do intermedi-backend),
// o estoque da unidade e quem tem o remédio na rede.
import { useMemo } from "react";
import { disponibilidade, estoqueDaFarmacia, podeEnviar, remedio as buscarRemedio } from "../../../demoServices/medicationService";
import { BarraEstoque, ChamadoModal, FotoRemedio, SituacaoBadges, TarjaBadge } from "../components/Remedios";
import { useGerente } from "../contexto";
import { TIPOS, formatarValidade, nomeComDosagem } from "../lib/remedios";

export function DetalheRemedio({ idRemedio, onFechar, onPedir }: { idRemedio: number; onFechar: () => void; onPedir?: (id: number) => void }) {
  const { config, visao } = useGerente();
  const r = buscarRemedio(idRemedio);
  const meu = useMemo(() => estoqueDaFarmacia(config.idFarmacia, visao.ajustes).find((l) => l.idRemedio === idRemedio), [config.idFarmacia, visao.ajustes, idRemedio]);
  const rede = useMemo(() => disponibilidade(idRemedio, visao.ajustes, config.idFarmacia), [idRemedio, visao.ajustes, config.idFarmacia]);
  if (!r) return null;
  const campos: [string, string][] = [
    ["Princípio ativo", r.principioAtivo],
    ["Categorias", r.categorias.join(", ")],
    ["Fabricante", r.fabricanteRemedio],
    ["Tipo", TIPOS[r.tipo as keyof typeof TIPOS] ?? r.tipo],
    ["Apresentação", r.apresentacaoRemedio],
    ["Forma farmacêutica", r.formaFarmaceutica],
    ["Via de administração", r.viaAdministracao],
    ["Registro ANVISA (fictício)", r.registroAnvisa],
    ["Indicações", r.indicacoes],
    ["Contraindicações", r.contraindicacoes],
    ["Armazenamento", r.armazenamento],
  ];
  return (
    <ChamadoModal title={nomeComDosagem(r)} onClose={onFechar} className="demo-detalhe-remedio">
      <div className="demo-detalhe-topo">
        <FotoRemedio nome={r.nomeRemedio} tamanho="lg" />
        <div>
          <p className="demo-detalhe-descricao">{r.descricao}</p>
          <TarjaBadge valor={r.tarjaRemedio} />
        </div>
      </div>

      {meu && (
        <section className="demo-detalhe-bloco" aria-label="Estoque da unidade">
          <h3>Na {config.unidade}</h3>
          <div className="demo-detalhe-estoque">
            <BarraEstoque quantidade={meu.quantidade} minimo={meu.estoqueMinimo} />
            <SituacaoBadges item={meu} />
            <small>Lote {meu.lote} · validade {formatarValidade(meu.validade)}</small>
          </div>
        </section>
      )}

      <section className="demo-detalhe-bloco" aria-label="Disponível na rede">
        <h3>Disponível na rede</h3>
        {rede.length ? (
          <ul className="demo-detalhe-rede">
            {rede.map((d) => (
              <li key={d.farmacia.idFarmacia}>
                <span>
                  <strong>{d.farmacia.nomeFarmacia}</strong>
                  <small>{d.farmacia.bairro} · {d.farmacia.cidade}/{d.farmacia.uf}</small>
                </span>
                <span className="demo-detalhe-qtd">
                  {d.quantidade.toLocaleString("pt-BR")} un.
                  <small>pode enviar até {podeEnviar(d)}</small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mgr-empty">Nenhuma outra farmácia tem este remédio em estoque agora.</p>
        )}
      </section>

      <section className="demo-detalhe-bloco" aria-label="Ficha do remédio">
        <h3>Ficha do remédio</h3>
        <dl className="demo-ficha">
          {campos.map(([rotulo, valor]) => (
            <div key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>
          ))}
        </dl>
      </section>

      <div className="mgr-modal-actions">
        <button type="button" className="mgr-secondary" onClick={onFechar}>Fechar</button>
        {onPedir && rede.some((d) => podeEnviar(d) > 0) && (
          <button type="button" className="mgr-primary" onClick={() => onPedir(idRemedio)}>Pedir à rede</button>
        )}
      </div>
    </ChamadoModal>
  );
}
