// Estoque de uma farmácia (farmacia/[id].tsx do intermedi-app).
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { farmacia as buscarFarmacia } from "../../../demoServices/pharmacyService";
import { POUCAS_UNIDADES, estoqueParaPaciente, formatoComprimido } from "../dados";
import { Ionicon } from "../components/Ionicon";
import { Cabecalho, MiniaturaRemedio, Tag, Vazio } from "../components/ui";

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
  const estoque = estoqueParaPaciente(f.idFarmacia);
  const q = normalizar(busca.trim());
  const itens = estoque.filter((i) => normalizar(`${i.remedio.nomeRemedio} ${i.remedio.dosagemRemedio}`).includes(q));
  const disponiveis = estoque.filter((i) => i.quantidade > 0 && !i.vencido).length;
  return (
    <div className="a-tela">
      <Cabecalho voltar titulo={f.nomeFarmacia} subtitulo={`${disponiveis} ${disponiveis === 1 ? "remédio disponível" : "remédios disponíveis"}`}>
        <p className="t-label a-cab-sub a-endereco">
          <Ionicon name="location-outline" size={16} /> {f.rua}, {f.numero} · {f.bairro} · {f.horario}
        </p>
        <label className="a-busca a-busca-campo a-busca-baixa">
          <Ionicon name="search-outline" size={20} color="var(--a-text-2)" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar remédio ou dosagem" aria-label="Buscar remédio ou dosagem" />
        </label>
      </Cabecalho>
      <div className="a-corpo">
        {!itens.length && <Vazio icone="cube-outline" titulo="Nada encontrado" texto="Nenhum medicamento encontrado para esta busca." />}
        {itens.map((i) => {
          const status = i.vencido
            ? { rotulo: "Vencido", tom: "red" as const }
            : i.quantidade === 0
              ? { rotulo: "Sem estoque", tom: "neutral" as const }
              : i.quantidade <= i.estoqueMinimo || i.quantidade < POUCAS_UNIDADES
                ? { rotulo: "Poucas unid.", tom: "amber" as const }
                : { rotulo: "Em estoque", tom: "green" as const };
          return (
            <button key={i.idEstoque} type="button" className="a-card a-item-estoque a-pressavel" onClick={() => navigate(`/aplicativo/medicamento/${i.idRemedio}`)} aria-label={`${i.remedio.nomeRemedio}, ${i.quantidade} unidades. Ver detalhes`}>
              <MiniaturaRemedio tom="neutral" formato={formatoComprimido(i.remedio)} tamanho={58} />
              <span className="a-flex">
                <span className="t-bodyBold">{i.remedio.nomeRemedio} {i.remedio.dosagemRemedio}</span>
                <span className="t-label">{i.quantidade.toLocaleString("pt-BR")} unidades · validade {i.validade.split("-").reverse().join("/")}</span>
                <span className="t-caption">Lote {i.lote}</span>
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
