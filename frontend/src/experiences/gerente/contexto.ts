import { createContext, useContext } from "react";
import type { VisaoPedidos } from "../../demoServices/orderService";
import type { ConfigGerente } from "./config";

export type ContextoGerente = {
  config: ConfigGerente;
  visao: VisaoPedidos;
  /** Abre o diálogo "Pedir à rede" (só na farmácia solicitante). */
  pedirARede: (idRemedio?: number) => void;
  /** Abre o detalhe de um remédio. */
  abrirRemedio: (idRemedio: number) => void;
};

export const GerenteContexto = createContext<ContextoGerente | null>(null);

export function useGerente(): ContextoGerente {
  const valor = useContext(GerenteContexto);
  if (!valor) throw new Error("GerenteContexto ausente");
  return valor;
}
