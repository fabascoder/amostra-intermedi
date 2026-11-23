// Remédios ((tabs)/buscar-medicamentos.tsx + a busca de pesquisa.tsx do intermedi-app).
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buscarRemedios, listarRemedios } from "../../../demoServices/medicationService";
import { categoriasDoCatalogo, estiloCategoria, ondeTem } from "../dados";
import { Ionicon } from "../components/Ionicon";
import { Cabecalho, CartaoRemedio, Vazio } from "../components/ui";

export default function Remedios() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selecionada = params.get("categoria") ?? "";
  const [busca, setBusca] = useState("");
  const buscaAdiada = useDeferredValue(busca);
  const campo = useRef<HTMLInputElement>(null);
  const categorias = useMemo(() => categoriasDoCatalogo(), []);

  useEffect(() => {
    if (params.get("buscar")) campo.current?.focus();
  }, [params]);

  const lista = buscarRemedios(buscaAdiada, listarRemedios()).filter((r) => !selecionada || r.categorias.includes(selecionada));
  const comEstoque = lista.filter((r) => ondeTem(r.idRemedio).length > 0).length;

  function escolher(categoria: string) {
    setParams(categoria ? { categoria } : {}, { replace: true });
  }

  return (
    <div className="a-tela">
      <Cabecalho titulo="Remédios" subtitulo="Encontre o que você precisa">
        <label className="a-busca a-busca-campo">
          <Ionicon name="search-outline" size={22} color="var(--a-text-2)" />
          <input
            ref={campo}
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou categoria"
            aria-label="Buscar por nome ou categoria"
            enterKeyHint="search"
          />
          {busca && (
            <button type="button" className="a-busca-limpar" aria-label="Limpar busca" onClick={() => setBusca("")}>
              <Ionicon name="close" size={18} />
            </button>
          )}
        </label>
      </Cabecalho>

      <div className="a-chips" role="tablist" aria-label="Categorias">
        <button type="button" role="tab" aria-selected={!selecionada} className={`a-chip${!selecionada ? " is-todos" : ""}`} onClick={() => escolher("")}>
          Todos
        </button>
        {categorias.map((rotulo) => {
          const ativo = selecionada === rotulo;
          return (
            <button key={rotulo} type="button" role="tab" aria-selected={ativo} className={`a-chip tom-${estiloCategoria(rotulo).tom}${ativo ? " is-ativo" : ""}`} onClick={() => escolher(ativo ? "" : rotulo)}>
              <i />
              {rotulo}
            </button>
          );
        })}
      </div>

      <div className="a-corpo">
        <p className="t-label" aria-live="polite">
          {comEstoque} {comEstoque === 1 ? "remédio" : "remédios"} com estoque perto de você
        </p>
        {!lista.length && (
          <Vazio icone="bandage-outline" titulo="Nenhum remédio encontrado" texto={busca ? "Tente outro nome ou uma categoria." : "Não há remédios cadastrados nesta categoria."} />
        )}
        {lista.map((r) => (
          <CartaoRemedio key={r.idRemedio} remedio={r} onClick={() => navigate(`/aplicativo/medicamento/${r.idRemedio}`)} />
        ))}
      </div>
    </div>
  );
}
