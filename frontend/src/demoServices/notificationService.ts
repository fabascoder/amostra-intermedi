// Avisos rápidos (toasts) das experiências. Um aviso por vez, como no
// intermedi-frontend (ToastRegion); o texto some sozinho depois de alguns
// segundos. Nada é enviado: são notificações locais da demonstração.
import { createStore, useStore } from "../lib/store";

export type Aviso = { id: number; texto: string; tom: "padrao" | "sucesso" };

const avisoStore = createStore<Aviso | null>(null);
let proximo = 1;
let timer = 0;

export function notificar(texto: string, { duracao = 7000, tom = "padrao" as Aviso["tom"] } = {}): void {
  window.clearTimeout(timer);
  avisoStore.set({ id: proximo++, texto, tom });
  timer = window.setTimeout(() => avisoStore.set(null), duracao);
}

export function fecharAviso(): void {
  window.clearTimeout(timer);
  avisoStore.set(null);
}

export const useAviso = () => useStore(avisoStore, (a) => a);
