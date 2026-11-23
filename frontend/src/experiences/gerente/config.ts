import { EQUIPES, ID_FORNECEDORA, ID_SOLICITANTE, farmaciaPorId } from "../../data/farmacias";

export type ExperienciaGerente = "solicitante" | "fornecedora";

export type ConfigGerente = {
  id: ExperienciaGerente;
  basePath: string;
  idFarmacia: number;
  unidade: string;
  gerente: string;
  links: { path: string; label: string; icon: string }[];
  /** Tarefas do painel "O que você faz aqui" do guia de boas-vindas. */
  tarefas: [string, string, string][];
};

const LINKS = [
  { path: "", label: "Visão geral", icon: "dashboard" },
  { path: "remedios", label: "Remédios", icon: "pill" },
  { path: "pedidos", label: "Pedidos da rede", icon: "truck" },
  { path: "funcionarios", label: "Funcionários", icon: "team" },
  { path: "operacao", label: "Operação 3D", icon: "cube" },
];

export const CONFIGS: Record<ExperienciaGerente, ConfigGerente> = {
  solicitante: {
    id: "solicitante",
    basePath: "/solicitante",
    idFarmacia: ID_SOLICITANTE,
    unidade: farmaciaPorId.get(ID_SOLICITANTE)!.nomeFarmacia,
    gerente: EQUIPES[ID_SOLICITANTE].gerente,
    links: LINKS,
    tarefas: [
      ["truck", "Pedir à rede", "Peça remédios a outras farmácias e acompanhe a entrega."],
      ["box", "Cuidar do estoque", "Fique de olho em itens críticos e vencidos."],
      ["pill", "Consultar remédios", "Veja os detalhes e quem tem cada um na rede."],
    ],
  },
  fornecedora: {
    id: "fornecedora",
    basePath: "/fornecedora",
    idFarmacia: ID_FORNECEDORA,
    unidade: farmaciaPorId.get(ID_FORNECEDORA)!.nomeFarmacia,
    gerente: EQUIPES[ID_FORNECEDORA].gerente,
    links: LINKS,
    tarefas: [
      ["truck", "Atender a rede", "Aceite ou recuse os pedidos de outras farmácias."],
      ["people", "Acompanhar a equipe", "Veja o funcionário preparar e despachar o envio."],
      ["box", "Cuidar do estoque", "Fique de olho em itens críticos e vencidos."],
    ],
  },
};
