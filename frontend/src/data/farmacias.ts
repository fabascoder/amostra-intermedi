import type { Farmacia, ItemEstoque, Pessoa } from "../types";

// Farmácias, pessoas e estoque FICTÍCIOS. Os nomes das unidades vêm dos
// exemplos dos projetos originais (managerData.js e seed.sql); endereços,
// telefones e coordenadas são inventados para a demonstração.

export const ID_SOLICITANTE = 1;
export const ID_FORNECEDORA = 2;

export const FARMACIAS: Farmacia[] = [
  { idFarmacia: 1, nomeFarmacia: "Farmácia Central", telFarmacia: "(11) 2550-0101", rua: "Rua das Acácias", numero: "120", bairro: "Guaianases", cidade: "São Paulo", uf: "SP", horario: "Seg. a sáb., das 7h às 21h", latitude: -23.5426, longitude: -46.4152 },
  { idFarmacia: 2, nomeFarmacia: "Farmácia Jardim", telFarmacia: "(11) 2550-0202", rua: "Avenida dos Ipês", numero: "845", bairro: "Jardim Soares", cidade: "São Paulo", uf: "SP", horario: "Seg. a sex., das 7h às 19h", latitude: -23.5531, longitude: -46.4019 },
  { idFarmacia: 3, nomeFarmacia: "Farmácia Saúde Leste", telFarmacia: "(11) 2550-0303", rua: "Rua Jequitibá", numero: "57", bairro: "Itaquera", cidade: "São Paulo", uf: "SP", horario: "Todos os dias, das 8h às 22h", latitude: -23.5385, longitude: -46.4553 },
  { idFarmacia: 4, nomeFarmacia: "Farmácia Vida", telFarmacia: "(11) 2550-0404", rua: "Rua dos Girassóis", numero: "310", bairro: "Lajeado", cidade: "São Paulo", uf: "SP", horario: "Seg. a sex., das 7h às 19h", latitude: -23.5302, longitude: -46.3988 },
  { idFarmacia: 5, nomeFarmacia: "Drogaria Bem Estar", telFarmacia: "(11) 2550-0505", rua: "Avenida das Palmeiras", numero: "1.020", bairro: "Cidade Tiradentes", cidade: "São Paulo", uf: "SP", horario: "Seg. a sáb., das 8h às 20h", latitude: -23.5826, longitude: -46.4085 },
];

export const farmaciaPorId = new Map(FARMACIAS.map((f) => [f.idFarmacia, f]));

/** Gerente e equipe de cada unidade usada nas experiências de gerente. */
export const EQUIPES: Record<number, { gerente: string; outrosGerentes: string[]; funcionarios: Pessoa[] }> = {
  [ID_SOLICITANTE]: {
    gerente: "Ana Souza",
    outrosGerentes: [],
    funcionarios: [
      { id: "f1", nome: "Carlos Almeida", cargo: "Farmacêutico", turno: "manha", matricula: "000101" },
      { id: "f2", nome: "Ana Oliveira", cargo: "Atendente", turno: "tarde", matricula: "000102" },
      { id: "f3", nome: "Beatriz Santos", cargo: "Farmacêutica", turno: "tarde", matricula: "000103" },
      { id: "f4", nome: "Mariana Costa", cargo: "Caixa", turno: "integral", matricula: "000104" },
    ],
  },
  [ID_FORNECEDORA]: {
    gerente: "Rafael Lima",
    outrosGerentes: ["Julia Alves"],
    funcionarios: [
      { id: "f5", nome: "Thiago Almeida", cargo: "Estoquista", turno: "manha", matricula: "000201" },
      { id: "f6", nome: "Pedro Henrique Silva", cargo: "Farmacêutico", turno: "noite", matricula: "000202" },
      { id: "f7", nome: "Larissa Mendes", cargo: "Atendente", turno: "manha", matricula: "000203" },
    ],
  },
};

// Validade relativa à data de hoje, para o estoque nunca "envelhecer".
function validadeEm(meses: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + meses + 1);
  d.setDate(0); // último dia do mês
  return d.toISOString().slice(0, 10);
}

// quantidade por farmácia (colunas 1..5), estoque mínimo e meses até vencer.
// Uma linha por remédio, na ordem do catálogo.
const MATRIZ: [number, [number, number, number, number, number], number, number][] = [
  // idRemedio, quantidades, mínimo, meses de validade
  [1, [42, 380, 210, 95, 160], 30, 14],
  [2, [8, 260, 140, 60, 0], 20, 10],
  [3, [64, 90, 35, 120, 40], 20, 18],
  [4, [36, 150, 0, 75, 52], 25, 9],
  [5, [12, 420, 80, 0, 64], 30, 7],
  [6, [180, 310, 95, 140, 210], 40, 16],
  [7, [0, 240, 120, 88, 30], 30, 12],
  [8, [96, 130, 60, 45, 70], 25, 11],
  [9, [14, 85, 40, 22, 0], 15, 6],
  [10, [55, 70, 18, 64, 90], 20, 13],
  [11, [48, 110, 75, 30, 25], 20, 20],
  [12, [70, 160, 52, 98, 40], 30, 15],
  [13, [120, 95, 140, 60, 80], 25, 8],
  [14, [33, 48, 25, 18, 56], 15, 19],
  [15, [26, 72, 30, 44, 12], 15, 5],
];

// Um lote vencido na Farmácia Central (aparece em "Itens com atenção").
const VENCIDOS = new Set(["1:13"]);

export const ESTOQUE: ItemEstoque[] = MATRIZ.flatMap(([idRemedio, quantidades, estoqueMinimo, meses]) =>
  quantidades.map((quantidade, i) => {
    const idFarmacia = i + 1;
    const vencido = VENCIDOS.has(`${idFarmacia}:${idRemedio}`);
    return {
      idEstoque: idRemedio * 10 + idFarmacia,
      idRemedio,
      idFarmacia,
      quantidade,
      estoqueMinimo,
      lote: `L${String(idFarmacia).padStart(2, "0")}${String(idRemedio).padStart(3, "0")}`,
      validade: vencido ? validadeEm(-1) : validadeEm(meses + (i % 3)),
    };
  }),
);
