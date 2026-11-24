// Botão "Ver vídeo da plataforma": leva ao vídeo do Intermedi completo. Sem
// link configurado (config/demo.ts), avisa que o vídeo estará disponível em breve.
// "compacto" mostra só o play (a faixa de uma linha da Central).
import { useEffect, useState } from "react";
import { VIDEO_PLATAFORMA_URL } from "../config/demo";
import "./videoPlataforma.css";

const ROTULO = "Ver vídeo da plataforma";

function Play() {
  return (
    <span className="video-plat-icone" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" /></svg>
    </span>
  );
}

export function VideoPlataforma({ className = "", tom = "claro", compacto = false }: { className?: string; tom?: "claro" | "escuro"; compacto?: boolean }) {
  const [aviso, setAviso] = useState(false);
  const classes = `video-plat is-${tom}${compacto ? " is-compacto" : ""} ${className}`.trim();

  // No modo compacto o aviso é um balão: some sozinho depois de alguns segundos.
  useEffect(() => {
    if (!aviso || !compacto) return undefined;
    const t = window.setTimeout(() => setAviso(false), 3200);
    return () => window.clearTimeout(t);
  }, [aviso, compacto]);

  if (VIDEO_PLATAFORMA_URL) {
    return (
      <a className={classes} href={VIDEO_PLATAFORMA_URL} target="_blank" rel="noopener noreferrer" aria-label={compacto ? ROTULO : undefined} title={compacto ? ROTULO : undefined}>
        <Play /> {!compacto && ROTULO}
      </a>
    );
  }
  return (
    <span className={`video-plat-grupo${compacto ? " is-compacto" : ""}`}>
      <button
        type="button"
        className={classes}
        onClick={() => setAviso(true)}
        aria-label={compacto ? ROTULO : undefined}
        title={compacto ? ROTULO : undefined}
        aria-describedby={aviso ? "video-plat-aviso" : undefined}
      >
        <Play /> {!compacto && ROTULO}
      </button>
      <span id="video-plat-aviso" className={`video-plat-aviso${aviso ? " is-visivel" : ""}`} role="status">
        {aviso ? "O vídeo estará disponível em breve." : ""}
      </span>
    </span>
  );
}
