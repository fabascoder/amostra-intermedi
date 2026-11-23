import { useEffect, useRef, type ReactNode } from "react";

/** Diálogo nativo (<dialog>): foco preso, Esc fecha, foco volta ao botão que abriu. */
export function Dialogo({ rotulo, onFechar, children, fechavel = true, className = "" }: {
  rotulo: string;
  onFechar: () => void;
  children: ReactNode;
  fechavel?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const dialogo = ref.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
    return () => {
      if (dialogo?.open) dialogo.close();
      anterior?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`demo-dialogo ${className}`}
      aria-label={rotulo}
      onCancel={(evento) => {
        evento.preventDefault();
        if (fechavel) onFechar();
      }}
      onClick={(evento) => {
        // clique no fundo escurecido fecha
        if (fechavel && evento.target === evento.currentTarget) onFechar();
      }}
    >
      {fechavel && (
        <button type="button" className="demo-dialogo-fechar" aria-label="Fechar" onClick={onFechar}>
          ×
        </button>
      )}
      {children}
    </dialog>
  );
}
