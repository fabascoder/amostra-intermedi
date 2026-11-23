import { useSyncExternalStore } from "react";

// Estado compartilhado mínimo, sem biblioteca: um valor, quem escuta e um
// hook com seletor. Componentes só renderizam quando a parte que leem muda.
export type Store<T> = {
  get: () => T;
  set: (proximo: T | ((atual: T) => T)) => void;
  subscribe: (ouvinte: () => void) => () => void;
};

export function createStore<T>(inicial: T): Store<T> {
  let valor = inicial;
  const ouvintes = new Set<() => void>();
  return {
    get: () => valor,
    set(proximo) {
      const novo = typeof proximo === "function" ? (proximo as (atual: T) => T)(valor) : proximo;
      if (Object.is(novo, valor)) return;
      valor = novo;
      ouvintes.forEach((ouvinte) => ouvinte());
    },
    subscribe(ouvinte) {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },
  };
}

export function useStore<T, S>(store: Store<T>, seletor: (valor: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => seletor(store.get()),
    () => seletor(store.get()),
  );
}
