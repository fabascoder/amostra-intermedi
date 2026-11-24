// Remédios da tela inicial separados por categoria, em fileiras que rolam para
// o lado (como as fileiras de filmes por gênero). As duas primeiras começam
// abertas; as outras ficam fechadas até a pessoa tocar em "Abrir".
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { REMEDIOS } from "../../../data/remedios";
import { estiloCategoria, ondeTem, tituloRemedio } from "../dados";
import { FotoRemedio } from "./Fotos";
import { Ionicon } from "./Ionicon";
import { IconTile } from "./ui";

const ABERTAS_NO_INICIO = 2;

function secoes() {
  const porCategoria = new Map<string, typeof REMEDIOS>();
  REMEDIOS.forEach((r) => r.categorias.forEach((c) => porCategoria.set(c, [...(porCategoria.get(c) ?? []), r])));
  return [...porCategoria.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "pt-BR"));
}

export function SecoesCategorias() {
  const navigate = useNavigate();
  const lista = secoes();
  const [abertas, setAbertas] = useState<Set<string>>(() => new Set(lista.slice(0, ABERTAS_NO_INICIO).map(([c]) => c)));
  const alternar = (c: string) =>
    setAbertas((atual) => {
      const nova = new Set(atual);
      if (nova.has(c)) nova.delete(c);
      else nova.add(c);
      return nova;
    });

  return (
    <div className="a-secoes">
      {lista.map(([categoria, remedios]) => {
        const aberta = abertas.has(categoria);
        const estilo = estiloCategoria(categoria);
        const id = `secao-${categoria.normalize("NFD").replace(/[^\w]/g, "")}`;
        return (
          <section key={categoria} className={`a-secao-cat${aberta ? " is-aberta" : ""}`} aria-labelledby={`${id}-titulo`}>
            <button type="button" className="a-secao-cat-cab" aria-expanded={aberta} aria-controls={id} onClick={() => alternar(categoria)}>
              <IconTile icone={estilo.icone} tom="cat" tamanho={42} />
              <span className="a-flex">
                <span id={`${id}-titulo`} className="t-bodyBold">{categoria}</span>
                <span className="t-caption">{remedios.length} {remedios.length === 1 ? "remédio" : "remédios"}</span>
              </span>
              <span className="a-secao-cat-acao">
                {aberta ? "Fechar" : "Abrir"}
                <Ionicon name="chevron-down" size={16} />
              </span>
            </button>
            <div id={id} className="a-secao-cat-corpo" hidden={!aberta}>
              <div className="a-fileira" role="list">
                {remedios.map((r, i) => {
                  const farmacias = ondeTem(r.idRemedio).length;
                  return (
                    <button
                      key={r.idRemedio}
                      type="button"
                      role="listitem"
                      className="a-fileira-card a-pressavel"
                      style={{ "--i": i } as React.CSSProperties}
                      onClick={() => navigate(`/aplicativo/medicamento/${r.idRemedio}`)}
                      aria-label={`${tituloRemedio(r)}. ${farmacias ? `${farmacias} farmácias têm` : "Em falta"}`}
                    >
                      <FotoRemedio remedio={r} tamanho={112} />
                      <span className="t-bodyBold a-uma-linha">{r.nomeRemedio}</span>
                      <span className="t-caption">{r.dosagemRemedio}</span>
                      <span className={`a-fileira-estoque${farmacias ? "" : " is-falta"}`}>
                        <i />
                        {farmacias ? `${farmacias} ${farmacias === 1 ? "farmácia" : "farmácias"}` : "Em falta"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
