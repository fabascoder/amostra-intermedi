// "Mapa · Liberty": escolhe o modelo do mapa, como o seletor-mapa.tsx do
// intermedi-app (mesmos modelos, mesma miniatura de fundo, água e rua).
import { useEffect, useRef, useState } from "react";
import { Ionicon } from "../components/Ionicon";
import { ESTILOS_MAPA, type EstiloMapa } from "./estilos";

export function SeletorMapa({ estilo, onChange }: { estilo: EstiloMapa; onChange: (estilo: EstiloMapa) => void }) {
  const [aberto, setAberto] = useState(false);
  const atual = ESTILOS_MAPA.find((item) => item.id === estilo)!;
  return (
    <>
      <button type="button" className="a-seletor-mapa" aria-label={`Escolher modelo do mapa. Atual: ${atual.nome}`} onClick={() => setAberto(true)}>
        <Ionicon name="layers-outline" size={18} />
        Mapa · {atual.nome}
        <Ionicon name="chevron-down" size={14} />
      </button>
      {aberto && <Folha estilo={estilo} onChange={(e) => { onChange(e); setAberto(false); }} onFechar={() => setAberto(false)} />}
    </>
  );
}

function Folha({ estilo, onChange, onFechar }: { estilo: EstiloMapa; onChange: (e: EstiloMapa) => void; onFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const d = ref.current;
    d?.showModal();
    return () => {
      if (d?.open) d.close();
      anterior?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="a-folha-modal a-folha-mapas"
      aria-label="Modelo do mapa"
      onCancel={(e) => { e.preventDefault(); onFechar(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="a-folha-modal-corpo">
        <div className="a-folha-mapas-topo">
          <h2 className="t-h3">Modelo do mapa</h2>
          <button type="button" className="a-folha-mapas-fechar" aria-label="Fechar" onClick={onFechar}>
            <Ionicon name="close" size={24} />
          </button>
        </div>
        <div className="a-folha-mapas-opcoes" role="radiogroup" aria-label="Modelos do mapa">
          {ESTILOS_MAPA.map((item) => {
            const selecionado = item.id === estilo;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selecionado}
                aria-label={`${item.nome}, ${item.descricao}`}
                className={`a-opcao-mapa${selecionado ? " is-ativa" : ""}`}
                onClick={() => onChange(item.id)}
              >
                <span className="a-opcao-mapa-amostra" style={{ background: item.fundo }} aria-hidden="true">
                  <i className="agua" style={{ background: item.agua }} />
                  <i className="rua" style={{ background: item.rua }} />
                  {item.id === "3d" && <Ionicon name="business" size={26} color="#708776" />}
                </span>
                <span className="a-flex">
                  <span className="t-bodyBold">{item.nome}</span>
                  <span className="t-caption">{item.descricao}</span>
                </span>
                <Ionicon name={selecionado ? "checkmark-circle" : "ellipse-outline"} size={23} />
              </button>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
