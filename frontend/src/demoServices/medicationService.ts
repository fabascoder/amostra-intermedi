// Serviço demonstrativo de medicamentos e estoque. Lê só os dados locais
// (src/data). A assinatura imita a API do intermedi-backend para que uma
// integração futura troque apenas a implementação.
import { ESTOQUE } from "../data/farmacias";
import { REMEDIOS, remedioPorId } from "../data/remedios";
import type { Farmacia, LinhaEstoque, Remedio } from "../types";
import { farmaciaPorId } from "../data/farmacias";

/** Ajustes de quantidade por "idFarmacia:idRemedio" vindos dos pedidos desta sessão. */
export type AjustesEstoque = Map<string, number>;

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const hoje = () => new Date().toISOString().slice(0, 10);

export function listarRemedios(): Remedio[] {
  return REMEDIOS;
}

export function remedio(id: number): Remedio | undefined {
  return remedioPorId.get(id);
}

export function buscarRemedios(busca: string, lista: Remedio[] = REMEDIOS): Remedio[] {
  const q = normalizar(busca.trim());
  if (!q) return lista;
  return lista.filter((r) =>
    normalizar([r.nomeRemedio, r.dosagemRemedio, r.principioAtivo, r.categorias.join(" "), r.fabricanteRemedio].join(" ")).includes(q),
  );
}

export function categorias(): string[] {
  return Array.from(new Set(REMEDIOS.flatMap((r) => r.categorias))).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function quantidadeAjustada(idFarmacia: number, idRemedio: number, base: number, ajustes?: AjustesEstoque) {
  return Math.max(0, base + (ajustes?.get(`${idFarmacia}:${idRemedio}`) ?? 0));
}

/** Estoque de uma farmácia no formato das telas do gerente (regra de situação do back-end). */
export function estoqueDaFarmacia(idFarmacia: number, ajustes?: AjustesEstoque): LinhaEstoque[] {
  const dia = hoje();
  return ESTOQUE.filter((e) => e.idFarmacia === idFarmacia).map((e) => {
    const r = remedioPorId.get(e.idRemedio)!;
    const quantidade = quantidadeAjustada(idFarmacia, e.idRemedio, e.quantidade, ajustes);
    return {
      ...e,
      quantidade,
      nomeRemedio: r.nomeRemedio,
      dosagemRemedio: r.dosagemRemedio,
      tarjaRemedio: r.tarjaRemedio,
      fotoRemedio: r.fotoRemedio,
      apresentacaoRemedio: r.apresentacaoRemedio,
      fabricanteRemedio: r.fabricanteRemedio,
      situacao: quantidade === 0 ? "zerado" : quantidade <= e.estoqueMinimo ? "critico" : "ok",
      vencido: e.validade < dia,
    };
  });
}

export function resumoEstoque(linhas: LinhaEstoque[]) {
  return {
    totalItens: linhas.length,
    criticos: linhas.filter((l) => l.situacao === "critico").length,
    zerados: linhas.filter((l) => l.situacao === "zerado").length,
    vencidos: linhas.filter((l) => l.vencido).length,
  };
}

export type Disponibilidade = { farmacia: Farmacia; quantidade: number; estoqueMinimo: number; vencido: boolean };

/** Em quais farmácias o remédio tem estoque utilizável (sem lote vencido). */
export function disponibilidade(idRemedio: number, ajustes?: AjustesEstoque, excetoFarmacia?: number): Disponibilidade[] {
  const dia = hoje();
  return ESTOQUE.filter((e) => e.idRemedio === idRemedio && e.idFarmacia !== excetoFarmacia)
    .map((e) => ({
      farmacia: farmaciaPorId.get(e.idFarmacia)!,
      quantidade: quantidadeAjustada(e.idFarmacia, idRemedio, e.quantidade, ajustes),
      estoqueMinimo: e.estoqueMinimo,
      vencido: e.validade < dia,
    }))
    .filter((d) => d.quantidade > 0 && !d.vencido)
    .sort((a, b) => b.quantidade - a.quantidade);
}

/** Quanto uma farmácia pode enviar sem ficar abaixo do mínimo dela. */
export const podeEnviar = (d: Pick<Disponibilidade, "quantidade" | "estoqueMinimo">) => Math.max(0, d.quantidade - d.estoqueMinimo);
