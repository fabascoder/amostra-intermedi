// O preparo do envio pela equipe da farmácia fornecedora, com o visual de
// components/PreparosFarmacia.jsx do intermedi-frontend (o aviso que os
// funcionários recebem: "Prepare 120× ... para a Farmácia X" + Começar).
// Na demonstração o gerente acompanha esse aviso e pode adiantar o início.
import { FORNECEDORA_TIMELINE } from "../../../config/simulation";
import { comecarPreparo } from "../../../demoServices/orderService";
import { equipe } from "../../../demoServices/pharmacyService";
import { ManagerIcon } from "../../../shared/icons";
import { useRelogio } from "../components/Rastreio";
import { useGerente } from "../contexto";
import { preparoDoPedido } from "../lib/rastreio";
import type { Pedido } from "../../../types";

const relogio = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const item = (p: Pedido) => `${p.quantidade}× ${[p.nomeRemedio, p.dosagemRemedio].filter(Boolean).join(" ")}`;

export function PreparosEquipe({ idPedido }: { idPedido?: number }) {
  const { config, visao } = useGerente();
  const funcionario = equipe(config.idFarmacia).funcionarios[0];
  const pedidos = visao.recebidos.filter(
    (p) => p.aoVivo && ["aprovada", "preparando"].includes(p.status) && (idPedido === undefined || p.idRedistribuicao === idPedido),
  );
  const emPreparo = pedidos.some((p) => p.status === "preparando" || p.status === "aprovada");
  const agora = useRelogio(emPreparo, 500);
  if (!pedidos.length) return null;

  return (
    <section className="preparos demo-preparos" aria-label="Preparo do envio pela equipe">
      {pedidos.map((p) => {
        const numero = `#${p.idRedistribuicao}`;
        if (p.status === "aprovada") {
          const assumeEm = p.dataAprovacao !== null ? Math.max(0, Math.ceil((p.dataAprovacao + FORNECEDORA_TIMELINE.funcionarioAssume - agora) / 1000)) : 0;
          return (
            <article key={p.idRedistribuicao} className="preparo preparo-aguardando">
              <span className="preparo-icone"><ManagerIcon name="box" size={20} /></span>
              <div className="preparo-texto">
                <small className="demo-preparo-contexto">Aviso na tela de {funcionario.nome} ({funcionario.cargo})</small>
                <strong>Prepare {item(p)} para a {p.nomeFarmaciaDestino}</strong>
                <small>
                  Pedido {numero} · {p.caixas} {p.caixas === 1 ? "caixa" : "caixas"} de {FORNECEDORA_TIMELINE.unidadesPorCaixa} un. ·
                  {" "}{assumeEm > 0 ? `${funcionario.nome.split(" ")[0]} assume em ${assumeEm} s` : "começando…"}
                </small>
              </div>
              <button
                type="button"
                className="mgr-primary"
                aria-label={`Começar agora o preparo do pedido ${numero}, como ${funcionario.nome}`}
                onClick={() => comecarPreparo(p.idRedistribuicao)}
                data-track="comecar-preparo"
              >
                Começar agora
              </button>
            </article>
          );
        }
        const prep = preparoDoPedido(p, agora);
        return (
          <article key={p.idRedistribuicao} className="preparo preparo-voce" aria-live="polite">
            <span className="preparo-icone"><ManagerIcon name="truck" size={20} /></span>
            <div className="preparo-texto">
              <small className="demo-preparo-contexto">{funcionario.nome} assumiu o preparo</small>
              <strong>Preparando o pedido {numero}: {item(p)}</strong>
              <small>
                {prep
                  ? `${prep.carregadas}/${prep.caixas} ${prep.caixas === 1 ? "caixa" : "caixas"} no caminhão · sai em ${relogio(prep.restante)}`
                  : "Carregando o caminhão"}
                {` · para a ${p.nomeFarmaciaDestino}`}
              </small>
              {prep && (
                <span className="preparo-barra" role="meter" aria-valuemin={0} aria-valuemax={prep.caixas} aria-valuenow={prep.carregadas} aria-label="Caixas no caminhão">
                  <i style={{ width: `${Math.round(prep.fracao * 100)}%` }} />
                </span>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
