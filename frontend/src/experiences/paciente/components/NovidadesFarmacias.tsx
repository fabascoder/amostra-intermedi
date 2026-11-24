// "Novidades nas farmácias": o que chegou em cada farmácia da rede e como está
// o estoque de cada uma. As entregas vêm dos pedidos da rede (o histórico e os
// que o visitante faz nas experiências de gerente), então uma entrega feita na
// farmácia que pede aparece aqui na hora.
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePedidos } from "../../../demoServices/orderService";
import { formatarKm } from "../../../demoServices/pharmacyService";
import { REMEDIOS } from "../../../data/remedios";
import type { Pedido } from "../../../types";
import { POUCAS_UNIDADES, estoqueParaPaciente, farmaciasPorDistancia } from "../dados";
import { FotoRemedio } from "./Fotos";
import { Ionicon } from "./Ionicon";

const MOSTRAR_FOTOS = 5;

function quando(ms: number, agora: number): string {
  const min = Math.max(0, Math.round((agora - ms) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const data = new Date(ms);
  const hoje = new Date(agora);
  const ontem = new Date(agora - 86400000);
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (data.toDateString() === hoje.toDateString()) return `hoje, ${hora}`;
  if (data.toDateString() === ontem.toDateString()) return `ontem, ${hora}`;
  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export function NovidadesFarmacias() {
  const navigate = useNavigate();
  const solicitante = usePedidos("solicitante");
  const fornecedora = usePedidos("fornecedora");
  const agora = solicitante.agora;

  // Entregas concluídas, sem repetir o mesmo pedido visto pelos dois lados.
  const entregas = useMemo(() => {
    const vistos = new Set<number>();
    return [...solicitante.enviados, ...fornecedora.recebidos]
      .filter((p): p is Pedido & { dataRecebimento: number } => p.status === "recebida" && p.dataRecebimento !== null)
      .filter((p) => (vistos.has(p.idRedistribuicao) ? false : (vistos.add(p.idRedistribuicao), true)))
      .sort((a, b) => b.dataRecebimento - a.dataRecebimento);
  }, [solicitante.enviados, fornecedora.recebidos]);

  const linhas = farmaciasPorDistancia()
    .map(({ farmacia, distancia }) => {
      const estoque = estoqueParaPaciente(farmacia.idFarmacia);
      const disponiveis = estoque.filter((e) => e.quantidade > 0 && !e.vencido);
      const acabando = disponiveis.filter((e) => e.quantidade < POUCAS_UNIDADES).length;
      const emFalta = REMEDIOS.length - disponiveis.length;
      const ultima = entregas.find((p) => p.idFarmaciaDestino === farmacia.idFarmacia) ?? null;
      return { farmacia, distancia, disponiveis, acabando, emFalta, ultima };
    })
    // quem recebeu algo por último aparece primeiro
    .sort((a, b) => (b.ultima?.dataRecebimento ?? 0) - (a.ultima?.dataRecebimento ?? 0) || a.distancia - b.distancia);

  return (
    <ul className="a-novidades" aria-label="Novidades nas farmácias">
      {linhas.map(({ farmacia, distancia, disponiveis, acabando, emFalta, ultima }) => (
        <li key={farmacia.idFarmacia}>
          <button type="button" className="a-novidade" onClick={() => navigate(`/aplicativo/farmacia/${farmacia.idFarmacia}`)}>
            <span className="a-novidade-topo">
              <span className="t-bodyBold a-uma-linha">{farmacia.nomeFarmacia}</span>
              <span className="t-caption a-novidade-quando">{ultima ? quando(ultima.dataRecebimento, agora) : formatarKm(distancia)}</span>
            </span>
            <span className={`a-novidade-fato${ultima ? " is-nova" : ""}`}>
              {ultima ? (
                <>
                  <Ionicon name="cube-outline" size={16} />
                  Recebeu {ultima.quantidade} un. de {ultima.nomeRemedio} {ultima.dosagemRemedio}
                </>
              ) : (
                <>Sem entregas novas · {farmacia.bairro}</>
              )}
            </span>
            <span className="a-novidade-estoque">
              <span className="a-novidade-fotos" aria-hidden="true">
                {disponiveis.slice(0, MOSTRAR_FOTOS).map((e) => <FotoRemedio key={e.idRemedio} remedio={e.remedio} tamanho={30} />)}
                {disponiveis.length > MOSTRAR_FOTOS && <span className="a-novidade-mais">+{disponiveis.length - MOSTRAR_FOTOS}</span>}
              </span>
              <span className="t-caption">
                <strong>{disponiveis.length}</strong> {disponiveis.length === 1 ? "remédio" : "remédios"}
                {acabando > 0 && <> · <span className="a-novidade-acabando">{acabando} acabando</span></>}
                {emFalta > 0 && <> · {emFalta} em falta</>}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
