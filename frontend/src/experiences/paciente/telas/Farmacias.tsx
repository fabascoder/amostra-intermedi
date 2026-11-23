// Farmácias ((tabs)/farmacias.tsx do intermedi-app), da mais perto para a mais longe.
import { useDeferredValue, useState } from "react";
import { farmaciasPorDistancia } from "../dados";
import { Ionicon } from "../components/Ionicon";
import { Cabecalho, CartaoFarmacia, Vazio } from "../components/ui";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Farmacias() {
  const [busca, setBusca] = useState("");
  const q = normalizar(useDeferredValue(busca).trim());
  const lista = farmaciasPorDistancia().filter(({ farmacia: f }) => !q || normalizar(`${f.nomeFarmacia} ${f.rua} ${f.bairro}`).includes(q));
  return (
    <div className="a-tela">
      <Cabecalho titulo="Farmácias" subtitulo="Encontre a mais próxima de você">
        <label className="a-busca a-busca-campo">
          <Ionicon name="search-outline" size={22} color="var(--a-text-2)" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou endereço" aria-label="Buscar por nome ou endereço" />
        </label>
      </Cabecalho>
      <div className="a-corpo">
        <p className="t-label">{lista.length} {lista.length === 1 ? "farmácia" : "farmácias"} perto de você</p>
        {!lista.length && <Vazio icone="business-outline" titulo="Nenhuma farmácia encontrada" />}
        {lista.map(({ farmacia, distancia }) => (
          <CartaoFarmacia key={farmacia.idFarmacia} farmacia={farmacia} distancia={distancia} />
        ))}
      </div>
    </div>
  );
}
