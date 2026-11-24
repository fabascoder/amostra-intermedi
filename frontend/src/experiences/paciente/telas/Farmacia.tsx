// Estoque de uma farmácia (farmacia/[id].tsx do intermedi-app).
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { farmacia as buscarFarmacia } from "../../../demoServices/pharmacyService";
import { POUCAS_UNIDADES, estoqueParaPaciente } from "../dados";
import { FotoFarmacia, FotoRemedio } from "../components/Fotos";
import { Ionicon } from "../components/Ionicon";
import { Cabecalho, Tag, Vazio } from "../components/ui";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Farmacia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const f = buscarFarmacia(Number(id));
  const [busca, setBusca] = useState("");
  if (!f) {
    return (
      <div className="a-tela">
        <Cabecalho voltar titulo="Estoque da farmácia" />
        <div className="a-corpo"><Vazio icone="business-outline" titulo="Farmácia não encontrada" /></div>
      </div>
    );
  }
  // Para o público: lote vencido conta como "em falta"; quem tem aparece primeiro.
  const estoque = estoqueParaPaciente(f.idFarmacia)
    .map((i) => ({ ...i, tem: i.quantidade > 0 && !i.vencido }))
    .sort((a, b) => Number(b.tem) - Number(a.tem) || a.remedio.nomeRemedio.localeCompare(b.remedio.nomeRemedio, "pt-BR"));
  const q = normalizar(busca.trim());
  const itens = estoque.filter((i) => normalizar(`${i.remedio.nomeRemedio} ${i.remedio.categorias.join(" ")}`).includes(q));
  const disponiveis = estoque.filter((i) => i.tem).length;
  return (
    <div className="a-tela">
      <Cabecalho voltar titulo={f.nomeFarmacia} subtitulo={`${disponiveis} ${disponiveis === 1 ? "remédio disponível" : "remédios disponíveis"}`}>
        <p className="t-label a-cab-sub a-endereco">
          <Ionicon name="location-outline" size={16} /> {f.rua}, {f.numero} · {f.bairro} · {f.horario}
        </p>
        <label className="a-busca a-busca-campo a-busca-baixa">
          <Ionicon name="search-outline" size={20} color="var(--a-text-2)" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="O que você procura?" aria-label="Buscar remédio nesta farmácia" />
        </label>
      </Cabecalho>
      <div className="a-corpo">
        <FotoFarmacia farmacia={f} altura={150} className="a-farmacia-fachada" />
        {!itens.length && <Vazio icone="cube-outline" titulo="Nada encontrado" texto="Tente outro nome de remédio." />}
        {itens.map((i) => {
          const status = !i.tem
            ? { rotulo: "Em falta", tom: "neutral" as const }
            : i.quantidade < POUCAS_UNIDADES
              ? { rotulo: "Últimas unidades", tom: "amber" as const }
              : { rotulo: "Tem", tom: "green" as const };
          return (
            <button key={i.idEstoque} type="button" className="a-card a-item-estoque a-pressavel" onClick={() => navigate(`/aplicativo/medicamento/${i.idRemedio}?farmacia=${f.idFarmacia}`)} aria-label={`${i.remedio.nomeRemedio}: ${status.rotulo}. Ver detalhes`}>
              <FotoRemedio remedio={i.remedio} tamanho={62} />
              <span className="a-flex">
                <span className="t-bodyBold">{i.remedio.nomeRemedio} {i.remedio.dosagemRemedio}</span>
                <span className="t-label">{i.remedio.categorias.join(" · ")}</span>
                <Tag rotulo={status.rotulo} tom={status.tom} className="a-tag-espaco" />
              </span>
              <Ionicon name="chevron-forward" size={20} color="var(--a-text-2)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
