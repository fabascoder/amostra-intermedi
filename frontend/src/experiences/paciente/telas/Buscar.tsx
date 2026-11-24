// Busca geral: só o fundo e o campo. Enquanto a pessoa digita, aparecem os
// cartões de remédios (pelo nome, categoria ou para que serve) e de farmácias
// (pelo nome ou bairro).
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { REMEDIOS } from "../../../data/remedios";
import { formatarKm } from "../../../demoServices/pharmacyService";
import { farmaciasPorDistancia, ondeTem, tituloRemedio } from "../dados";
import { FotoFarmacia, FotoRemedio } from "../components/Fotos";
import { Ionicon } from "../components/Ionicon";
import { BotaoVoltar } from "../components/ui";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Buscar() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const q = normalizar(useDeferredValue(texto).trim());

  useEffect(() => {
    campo.current?.focus();
  }, []);

  const remedios = q
    ? REMEDIOS.filter((r) => normalizar(`${r.nomeRemedio} ${r.categorias.join(" ")} ${r.indicacoes}`).includes(q))
    : [];
  const farmacias = q
    ? farmaciasPorDistancia().filter(({ farmacia: f }) => normalizar(`${f.nomeFarmacia} ${f.bairro} ${f.rua}`).includes(q))
    : [];
  const total = remedios.length + farmacias.length;

  return (
    <div className={`a-tela a-buscar${q ? " tem-busca" : ""}`}>
      <div className="a-buscar-topo">
        <BotaoVoltar tom="dark" />
      </div>
      <div className="a-buscar-campo-area">
        {!q && <p className="t-h2 a-buscar-convite">O que você procura?</p>}
        <label className="a-buscar-campo">
          <Ionicon name="search-outline" size={24} color="var(--a-text-2)" />
          <input
            ref={campo}
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Remédio, sintoma ou farmácia"
            aria-label="Buscar remédio, sintoma ou farmácia"
            enterKeyHint="search"
          />
          {texto && (
            <button type="button" className="a-busca-limpar" aria-label="Limpar busca" onClick={() => { setTexto(""); campo.current?.focus(); }}>
              <Ionicon name="close" size={18} />
            </button>
          )}
        </label>
      </div>

      <div className="a-buscar-resultados" aria-live="polite">
        {q && !total && <p className="t-label a-buscar-nada">Nada encontrado para “{texto.trim()}”. Tente outro nome.</p>}
        {remedios.map((r, i) => {
          const tem = ondeTem(r.idRemedio).length;
          return (
            <button key={`r${r.idRemedio}`} type="button" className="a-buscar-card a-pressavel" style={{ "--i": i } as React.CSSProperties} onClick={() => navigate(`/aplicativo/medicamento/${r.idRemedio}`)}>
              <FotoRemedio remedio={r} tamanho={64} />
              <span className="a-flex">
                <span className="t-caption a-buscar-tipo">Remédio</span>
                <span className="t-bodyBold a-uma-linha">{tituloRemedio(r)}</span>
                <span className="t-label a-uma-linha">{tem ? `${tem} ${tem === 1 ? "farmácia tem" : "farmácias têm"}` : "Em falta agora"}</span>
              </span>
              <Ionicon name="chevron-forward" size={20} color="var(--a-text-2)" />
            </button>
          );
        })}
        {farmacias.map(({ farmacia: f, distancia }, i) => (
          <button key={`f${f.idFarmacia}`} type="button" className="a-buscar-card a-pressavel" style={{ "--i": remedios.length + i } as React.CSSProperties} onClick={() => navigate(`/aplicativo/farmacia/${f.idFarmacia}`)}>
            <span className="a-buscar-fachada"><FotoFarmacia farmacia={f} altura={64} /></span>
            <span className="a-flex">
              <span className="t-caption a-buscar-tipo">Farmácia</span>
              <span className="t-bodyBold a-uma-linha">{f.nomeFarmacia}</span>
              <span className="t-label a-uma-linha">{[f.bairro, formatarKm(distancia)].filter(Boolean).join(" · ")}</span>
            </span>
            <Ionicon name="chevron-forward" size={20} color="var(--a-text-2)" />
          </button>
        ))}
      </div>
    </div>
  );
}
