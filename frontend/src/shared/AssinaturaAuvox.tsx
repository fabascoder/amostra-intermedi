// Assinatura no pé da tela de entrada, como o "from Meta" de outros apps:
// "um produto da" em cima e a marca da Auvox embaixo.
// Para usar a logo oficial, coloque o arquivo em assets/brand e passe-o em LOGO_AUVOX.
import "./assinaturaAuvox.css";

const LOGO_AUVOX: string | null = null;

export function AssinaturaAuvox({ className = "" }: { className?: string }) {
  return (
    <a className={`assinatura-auvox ${className}`.trim()} href="https://auvox.vercel.app" target="_blank" rel="noopener noreferrer" aria-label="Um produto da Auvox (abre o site da Auvox)">
      <span className="assinatura-auvox-de">um produto da</span>
      <span className="assinatura-auvox-marca">
        {LOGO_AUVOX && <img src={LOGO_AUVOX} alt="" width="22" height="22" />}
        auvox
      </span>
    </a>
  );
}
