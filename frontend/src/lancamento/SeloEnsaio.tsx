// Selo do modo de ensaio: lembra a equipe de que esta aba está simulando o
// lançamento e permite repetir ou sair. Nunca aparece para o público.
import { ensaioAtual, repetirEnsaio, sairDoEnsaio } from "./fase";

const NOMES = { contagem: "contagem", abertura: "abertura", depois: "depois do lançamento" } as const;

export default function SeloEnsaio() {
  const ensaio = ensaioAtual();
  if (!ensaio) return null;
  const detalhe = ensaio.fase === "contagem" ? `${NOMES.contagem} de ${ensaio.em} s` : NOMES[ensaio.fase];
  return (
    <div
      role="region"
      aria-label="Modo de ensaio"
      style={{
        position: "fixed",
        left: "50%",
        top: 10,
        transform: "translateX(-50%)",
        maxWidth: "calc(100vw - 24px)",
        whiteSpace: "nowrap",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 6px 6px 12px",
        borderRadius: 999,
        background: "rgb(29 29 31 / 0.88)",
        color: "#fff",
        font: '500 12px/1.2 "Inter Variable", system-ui, sans-serif',
        boxShadow: "0 6px 24px rgb(0 0 0 / 0.2)",
      }}
    >
      <span>
        Ensaio: {detalhe}
        {ensaio.quadro !== null ? `, parado em ${ensaio.quadro} s` : ""}
        {ensaio.perfil === "leve" ? ", perfil leve" : ""}
      </span>
      {[
        ["Repetir", repetirEnsaio],
        ["Sair", sairDoEnsaio],
      ].map(([rotulo, acao]) => (
        <button
          key={rotulo as string}
          type="button"
          onClick={acao as () => void}
          style={{ border: 0, borderRadius: 999, padding: "5px 10px", background: "rgb(255 255 255 / 0.14)", color: "#fff", font: "inherit", cursor: "pointer" }}
        >
          {rotulo as string}
        </button>
      ))}
    </div>
  );
}
