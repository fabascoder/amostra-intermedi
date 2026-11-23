// Favoritos ((tabs)/favoritos.tsx do intermedi-app).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { REMEDIOS } from "../../../data/remedios";
import { usePaciente } from "../../../demoServices/patientService";
import { farmaciasPorDistancia } from "../dados";
import { Cabecalho, CartaoFarmacia, CartaoRemedio, Vazio } from "../components/ui";

export default function Favoritos() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<"remedios" | "farmacias">("remedios");
  const idsRemedios = usePaciente((p) => p.favoritosRemedios);
  const idsFarmacias = usePaciente((p) => p.favoritosFarmacias);
  const remedios = REMEDIOS.filter((r) => idsRemedios.includes(r.idRemedio));
  const farmacias = farmaciasPorDistancia().filter(({ farmacia }) => idsFarmacias.includes(farmacia.idFarmacia));
  return (
    <div className="a-tela">
      <Cabecalho titulo="Favoritos" subtitulo="Salvos para acesso rápido" />
      <div className="a-corpo">
        <div className="a-abas" role="tablist" aria-label="Tipo de favorito">
          {([["remedios", "Remédios"], ["farmacias", "Farmácias"]] as const).map(([chave, titulo]) => (
            <button key={chave} type="button" role="tab" aria-selected={aba === chave} className={aba === chave ? "is-ativa" : undefined} onClick={() => setAba(chave)}>
              {titulo}
            </button>
          ))}
        </div>
        {aba === "remedios" ? (
          <>
            {!remedios.length && <Vazio icone="heart-outline" titulo="Nenhum remédio salvo" texto="Toque no coração na página de um remédio para salvá-lo aqui." />}
            {remedios.map((r) => (
              <CartaoRemedio key={r.idRemedio} remedio={r} mostrarFavorito onClick={() => navigate(`/aplicativo/medicamento/${r.idRemedio}`)} />
            ))}
          </>
        ) : (
          <>
            {!farmacias.length && <Vazio icone="heart-outline" titulo="Nenhuma farmácia salva" texto="Toque no coração na lista de farmácias para salvá-la aqui." />}
            {farmacias.map(({ farmacia, distancia }) => (
              <CartaoFarmacia key={farmacia.idFarmacia} farmacia={farmacia} distancia={distancia} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
