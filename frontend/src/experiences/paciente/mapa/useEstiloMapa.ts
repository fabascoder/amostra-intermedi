// Modelo de mapa escolhido, lembrado neste aparelho (o app guarda no
// AsyncStorage; aqui, no armazenamento do navegador).
import { useState } from "react";
import { ESTILO_MAPA_PADRAO, isEstiloMapa, type EstiloMapa } from "./estilos";

const CHAVE = "intermedi_demo_estilo_mapa";

function lerEstilo(): EstiloMapa {
  try {
    const valor = window.localStorage.getItem(CHAVE);
    return isEstiloMapa(valor) ? valor : ESTILO_MAPA_PADRAO;
  } catch {
    return ESTILO_MAPA_PADRAO;
  }
}

export function useEstiloMapa() {
  const [estilo, setEstilo] = useState<EstiloMapa>(lerEstilo);
  function escolherEstilo(novo: EstiloMapa) {
    setEstilo(novo);
    try {
      window.localStorage.setItem(CHAVE, novo);
    } catch {
      /* sem armazenamento: vale só até fechar a tela */
    }
  }
  return { estilo, escolherEstilo };
}
