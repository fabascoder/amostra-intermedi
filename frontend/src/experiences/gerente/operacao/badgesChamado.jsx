// Selos de chamado usados pelo inspetor da Operação 3D. Na demonstração não há
// chamados de funcionários, mas o inspetor original sabe mostrá-los.
const PRIORIDADES = {
  baixa: { label: "Baixa", tone: "neutral" },
  media: { label: "Média", tone: "blue" },
  alta: { label: "Alta", tone: "orange" },
  urgente: { label: "Urgente", tone: "red" },
};
const STATUS = {
  pendente: { label: "Pendente", tone: "yellow" },
  aceito: { label: "Aceito", tone: "blue" },
  em_andamento: { label: "Em andamento", tone: "blue" },
  concluido: { label: "Concluído", tone: "green" },
  recusado: { label: "Recusado", tone: "red" },
};

export function PrioridadeBadge({ prioridade }) {
  const { label, tone } = PRIORIDADES[prioridade] ?? { label: prioridade || "—", tone: "neutral" };
  return <span className={`mgr-badge chamado-badge ${tone}`} title="Prioridade">{label}</span>;
}

export function StatusChamadoBadge({ status }) {
  const { label, tone } = STATUS[status] ?? { label: status || "—", tone: "neutral" };
  return <span className={`mgr-badge chamado-badge ${tone}`}>{label}</span>;
}
