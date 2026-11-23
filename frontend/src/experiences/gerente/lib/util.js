// Utilitários do intermedi-frontend (services/perfil.js e services/nomes.js).
const INTERATIVO = "button, a, input, select, textarea, label, [role='menu'], [role='menuitem'], [data-sem-perfil]";

// Linha inteira clicável (abre o detalhe), sem roubar o clique dos botões dela.
export function propsLinha(abrir, rotulo) {
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": rotulo,
    className: "perfil-linha",
    onClick: (event) => {
      const alvo = event.target.closest?.(INTERATIVO);
      if (alvo && alvo !== event.currentTarget) return;
      abrir(event.currentTarget);
    },
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        abrir(event.currentTarget);
      }
    },
  };
}

export const TURNOS = { manha: "Manhã", tarde: "Tarde", noite: "Noite", integral: "Integral" };
export const turno = (valor) => TURNOS[valor] || valor || "—";

// Só o primeiro nome, com a primeira letra maiúscula ("FABRICIO aparecido" -> "Fabricio").
export function primeiroNome(nomeCompleto, padrao = "") {
  const [primeiro] = String(nomeCompleto ?? "").trim().split(/\s+/);
  if (!primeiro) return padrao;
  const minusculo = primeiro.toLocaleLowerCase("pt-BR");
  return minusculo.charAt(0).toLocaleUpperCase("pt-BR") + minusculo.slice(1);
}
