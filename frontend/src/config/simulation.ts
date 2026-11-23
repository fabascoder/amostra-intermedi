// Tempos das simulações (em milissegundos a partir do início de cada uma).
// O estágio é sempre calculado a partir de timestamps absolutos: a simulação
// continua correta se o visitante trocar de tela, recarregar ou fechar a aba.

/** Farmácia solicitante: do envio do pedido até a entrega. */
export const SOLICITANTE_TIMELINE = {
  aceite: 5_000, // fornecedora aceitou
  preparo: 10_000, // medicamento em preparação
  envio: 15_000, // em transporte
  entrega: 20_000, // entrega concluída
} as const;

/** Farmácia fornecedora: chegada da solicitação e etapas depois do aceite. */
export const FORNECEDORA_TIMELINE = {
  /** Espera até a notificação "Nova solicitação de medicamento recebida." */
  chegadaSolicitacao: 3_000,
  /** Depois do aceite, o funcionário assume o preparo sozinho após este tempo. */
  funcionarioAssume: 5_000,
  /** Cada caixa levada até o caminhão (regra do sistema original: 50 un. por caixa). */
  porCaixa: 4_000,
  unidadesPorCaixa: 50,
  /** Viagem do caminhão até a farmácia solicitante. */
  viagem: 10_000,
} as const;
