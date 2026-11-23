import { Link } from "react-router-dom";
import { formatarRestante, useAgora, useExpiraEm, useSituacaoSessao } from "../session/hooks";
import { ManagerIcon } from "./icons";

const QUINZE_MIN = 15 * 60 * 1000;

/**
 * "Modo Demo · 02:59:42 restantes". Só este componente renderiza a cada
 * segundo; o resto da aplicação não é afetado pelo relógio.
 */
export function ContadorSessao({ escuro = false, compacto = false }: { escuro?: boolean; compacto?: boolean }) {
  const expiraEm = useExpiraEm();
  const situacao = useSituacaoSessao();
  const agora = useAgora(situacao === "ativa");
  if (situacao !== "ativa" || !expiraEm) {
    return (
      <span className={`demo-chip${escuro ? " demo-chip-escuro" : ""}`}>
        <i aria-hidden="true" />
        Modo Demo
      </span>
    );
  }
  const restante = expiraEm - agora;
  const texto = formatarRestante(restante);
  return (
    <span
      className={`demo-chip${escuro ? " demo-chip-escuro" : ""}${restante < QUINZE_MIN ? " is-pouco" : ""}`}
      role="timer"
      aria-label={`Modo Demo: ${Math.max(0, Math.ceil(restante / 60000))} minutos restantes`}
    >
      <i aria-hidden="true" />
      {!compacto && <span aria-hidden="true">Modo Demo ·</span>}
      <b aria-hidden="true">{texto}</b>
      {!compacto && <span className="demo-chip-sufixo" aria-hidden="true">restantes</span>}
    </span>
  );
}

/** Volta à Central sem encerrar a sessão nem apagar nada. */
export function TrocarExperiencia({ className = "", rotulo = "Trocar experiência" }: { className?: string; rotulo?: string }) {
  return (
    <Link to="/" className={`demo-trocar ${className}`} data-track="trocar-experiencia">
      <ManagerIcon name="swap" size={17} />
      {rotulo}
    </Link>
  );
}
