// Tipos do Intermedi Demo. Os nomes dos campos seguem o intermedi-backend
// (tabelas remedio, farmacia, estoque e redistribuicao) para que as telas
// reaproveitadas do intermedi-frontend funcionem sem adaptação de formato.

export type Tarja = "sem_tarja" | "vermelha" | "vermelha_retencao" | "preta";
export type TipoRemedio = "referencia" | "generico" | "similar";

export type Remedio = {
  idRemedio: number;
  nomeRemedio: string;
  principioAtivo: string;
  descricao: string;
  dosagemRemedio: string;
  fabricanteRemedio: string;
  registroAnvisa: string;
  tipo: TipoRemedio;
  tarjaRemedio: Tarja;
  formaFarmaceutica: string;
  viaAdministracao: string;
  apresentacaoRemedio: string;
  indicacoes: string;
  contraindicacoes: string;
  armazenamento: string;
  categorias: string[];
  fotoRemedio: string | null;
};

export type Farmacia = {
  idFarmacia: number;
  nomeFarmacia: string;
  telFarmacia: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  horario: string;
  latitude: number;
  longitude: number;
};

export type Pessoa = {
  id: string;
  nome: string;
  cargo: string;
  turno: "manha" | "tarde" | "noite" | "integral";
  matricula: string;
};

export type ItemEstoque = {
  idEstoque: number;
  idRemedio: number;
  idFarmacia: number;
  quantidade: number;
  estoqueMinimo: number;
  lote: string;
  validade: string; // AAAA-MM-DD
};

/** Linha de estoque já combinada com o catálogo (formato das telas do gerente). */
export type LinhaEstoque = ItemEstoque &
  Pick<Remedio, "nomeRemedio" | "dosagemRemedio" | "tarjaRemedio" | "fotoRemedio" | "apresentacaoRemedio" | "fabricanteRemedio"> & {
    situacao: "ok" | "critico" | "zerado";
    vencido: boolean;
  };

export type StatusPedido = "solicitada" | "aprovada" | "preparando" | "enviada" | "recebida" | "recusada" | "cancelada";
export type Perspectiva = "solicitante" | "fornecedor" | "unidade";

/** Pedido entre farmácias (redistribuição), no formato lido pelo rastreio original. */
export type Pedido = {
  idRedistribuicao: number;
  idRemedio: number;
  nomeRemedio: string;
  dosagemRemedio: string;
  tarjaRemedio: Tarja;
  fotoRemedio: string | null;
  quantidade: number;
  idFarmaciaOrigem: number;
  nomeFarmaciaOrigem: string;
  idFarmaciaDestino: number;
  nomeFarmaciaDestino: string;
  status: StatusPedido;
  mensagem: string;
  dataSolicitacao: number;
  dataAprovacao: number | null;
  dataInicioPreparo: number | null;
  dataEnvio: number | null;
  dataPrevistaChegada: number | null;
  dataRecebimento: number | null;
  dataRecusa: number | null;
  motivoRecusa: string | null;
  nomeGerenteResposta: string | null;
  nomeFuncionarioPreparo: string | null;
  caixas: number;
  estoqueOrigem: number;
  estoqueMinimoOrigem: number;
  perspectiva: Perspectiva;
  /** Pedido criado nesta demonstração (não faz parte do histórico fictício). */
  aoVivo: boolean;
};

export type ExperienciaId = "solicitante" | "fornecedora" | "paciente";

export type Sessao = {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  status: "active" | "expired";
  /** Primeiro nome do visitante, guardado só na sessão encerrada (pedido de novo acesso). */
  nome?: string;
};

export type Progresso = {
  visitadas: Partial<Record<ExperienciaId, number>>;
  onboardingSolicitanteConcluido: boolean;
  onboardingFornecedoraConcluido: boolean;
  simulacoesConcluidas: Partial<Record<"solicitante" | "fornecedora", number>>;
  conviteAvaliacaoDispensado: boolean;
  /** Agradecimento mostrado depois das três experiências. */
  agradecimentoVisto: boolean;
  /** Guia prático (passo a passo do primeiro pedido) concluído ou pulado. */
  guiasConcluidos: Partial<Record<"solicitante" | "fornecedora", true>>;
  /** Abriu os Bastidores (libera o cartão "Conheça a Auvox" na Central). */
  bastidoresVisto?: boolean;
  /** Dicas de etapa da Central já vistas ("bastidores", "auvox"). */
  dicasVistas?: string[];
  /** Convites depois das três experiências (avaliar, Auvox, Instagram, bastidores). */
  convites: { proximoEm: number | null; vistos: string[] };
};

export type AlvoAvaliacao = "geral" | "paciente" | "solicitante" | "fornecedora";

export type Avaliacao = {
  id: string;
  nota: 1 | 2 | 3 | 4 | 5;
  alvo: AlvoAvaliacao;
  comentario: string;
  criadaEm: number;
};
