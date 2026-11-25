import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SESSION_CHECK_INTERVAL_MS } from "../config/demo";
import { useStore } from "../lib/store";
import { progressoStore, sessaoStore, situacao, verificarSessao } from "./session";
import type { Progresso } from "../types";

export const useSituacaoSessao = () => useStore(sessaoStore, (e) => situacao(e.sessao));
export const useNomeDaSessao = () => useStore(sessaoStore, (e) => e.sessao?.nome ?? "");
export const useExpiraEm =() => useStore(sessaoStore, (e) => e.sessao?.expiresAt ?? null);
export const useIdSessao = () => useStore(sessaoStore, (e) => (e.sessao?.status === "active" ? e.sessao.sessionId : null));
export function useProgresso<S>(seletor: (p: Progresso) => S): S {
  return useStore(progressoStore, seletor);
}

/**
 * Vigia a validade da sessão enquanto a aplicação está aberta: a cada troca
 * de rota, a cada 15 s, quando a aba volta a ficar visível e no instante
 * exato da expiração (um timeout curto e renovado, não um timer de 3 h).
 */
export function useVigiaSessao(): void {
  const { pathname } = useLocation();
  const expiraEm = useExpiraEm();
  const sit = useSituacaoSessao();

  useEffect(() => {
    verificarSessao();
  }, [pathname]);

  useEffect(() => {
    if (sit !== "ativa") return undefined;
    const intervalo = window.setInterval(verificarSessao, SESSION_CHECK_INTERVAL_MS);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") verificarSessao();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    window.addEventListener("pageshow", aoVoltar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
      window.removeEventListener("pageshow", aoVoltar);
    };
  }, [sit]);

  // Se faltar menos que o intervalo de verificação, agenda a checagem no segundo exato.
  useEffect(() => {
    if (sit !== "ativa" || !expiraEm) return undefined;
    const falta = expiraEm - Date.now();
    if (falta > SESSION_CHECK_INTERVAL_MS * 2) {
      const timer = window.setTimeout(() => verificarSessao(), Math.min(falta - SESSION_CHECK_INTERVAL_MS, 2 ** 31 - 1));
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => verificarSessao(), Math.max(0, falta) + 30);
    return () => window.clearTimeout(timer);
  }, [sit, expiraEm]);
}

/**
 * Relógio local: só o componente que o usa renderiza a cada passo.
 * Pausa quando a aba está escondida e corrige ao voltar.
 */
export function useAgora(ativo = true, passo = 1000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!ativo) return undefined;
    let timer = 0;
    const tique = () => {
      setAgora(Date.now());
      // alinha ao próximo segundo cheio para o contador não "pular"
      timer = window.setTimeout(tique, passo - (Date.now() % passo) + 5);
    };
    const visivel = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") tique();
    };
    tique();
    document.addEventListener("visibilitychange", visivel);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visivel);
    };
  }, [ativo, passo]);
  return agora;
}

/** "02:59:42" */
export function formatarRestante(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
